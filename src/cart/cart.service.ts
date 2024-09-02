import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateCartItemDto } from './dto/create-cart.dto';
import { KNEX_CONNECTION } from '../database/knexfile';
import { Knex } from 'knex';
import {
  Cart,
  CartItem,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentProvider,
  PaymentStatus,
} from './entities/cart.entity';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { User } from '../user/entities/user.entity';
import { firstValueFrom } from 'rxjs';
import { Ticket } from '../events/entities/event.entity';
import { TicketNotFoundException } from '../events/events.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InjectQueue } from '@nestjs/bullmq';
import { BullTypes, EmailTypes } from '../config/types';
import { Queue } from 'bullmq';
import { TableName } from '../database/tables';

@Injectable()
export class CartService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectQueue(BullTypes.EMAIL) private readonly emailQueue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async addItemToCart(userId: string, item: CreateCartItemDto) {
    // if the item added already exists, increment the amount in cart and decrement the available ticket quantity
    const [cart] = await this.knex<Cart>(TableName.CARTS)
      .insert({
        user_id: userId,
      })
      .onConflict('user_id')
      .merge(['user_id'])
      .returning('id');

    const [ticket] = await this.knex<Ticket>(TableName.TICKETS)
      .where({ id: item.ticket_id })
      .select('id', 'available_quantity');
    if (!ticket) {
      throw new TicketNotFoundException();
    }

    if (ticket.available_quantity < item.quantity) {
      throw new BadRequestException('ticket quantity not available');
    }

    const [cartItem] = await this.knex<CartItem>(TableName.CART_ITEMS)
      .insert({
        ticket_id: ticket.id,
        quantity: item.quantity,
        cart_id: cart.id,
      } as CartItem)
      .returning('*');

    return cartItem;
  }

  async getItemsInCart(userId: string) {
    return await this.knex<CartItem>(TableName.CART_ITEMS)
      .select(
        'cart_items.*',
        'tickets.price',
        'tickets.available_quantity',
        this.knex.raw('(tickets.price * cart_items.quantity) as subtotal'),
      )
      .from('cart_items')
      .leftJoin('tickets', 'cart_items.ticket_id', 'tickets.id')
      .leftJoin('carts', 'cart_items.cart_id', 'carts.id')
      .where('carts.user_id', userId)
      .groupBy('cart_items.id', 'tickets.id')
      .orderBy('cart_items.created_at', 'DESC')
      .then((results) => {
        return {
          items: results,
          total: results.reduce((acc, item) => acc + Number(item.subtotal), 0),
        };
      });
  }

  async checkoutCart(user: User) {
    // const [cart] = await this.knex<Cart>(TableName.CARTS)
    //   .where({ user_id: user.id })
    //   .select('*'); // remove this line

    // make sure that all the items in the cart is available
    const cartItems = await this.getItemsInCart(user.id);
    const apiKey = this.configService.get<string>('paystack_secret_key');
    const { data } = await firstValueFrom(
      this.httpService.post(
        'https://api.paystack.co/transaction/initialize',
        {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          amount: Number(cartItems.total),
          callback_url: 'http://localhost:3000/checkout',
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    // move this into a queue
    await this.knex.transaction(async (trx) => {
      try {
        const [order] = await trx<Order>(TableName.ORDERS)
          .insert({
            user_id: user.id,
            total_amount: cartItems.total,
          } as Order)
          .returning('*');

        const items = await trx<OrderItem>(TableName.ORDER_ITEMS)
          .insert(
            cartItems.items.map(
              (item) =>
                ({
                  ticket_id: item.ticket_id,
                  quantity: item.quantity,
                  order_id: order.id,
                }) as OrderItem,
            ),
          )
          .returning('id');
        if (items.length !== cartItems.items.length) {
          throw new InternalServerErrorException('order items not created');
        }

        for (const item of cartItems.items) {
          const ticketRecord = await trx<Ticket>(TableName.TICKETS)
            .where('id', item.ticket_id)
            .andWhere('available_quantity', '>=', item.quantity)
            .decrement('available_quantity', item.quantity)
            .forUpdate();
          if (ticketRecord === 0) {
            throw new InternalServerErrorException(
              'ticket quantity not updated',
            );
          }
        }

        const paymentRecord = await trx<Payment>(TableName.PAYMENTS)
          .insert({
            amount: order.total_amount,
            txn_reference: data.data.reference,
            order_id: order.id,
          } as Payment)
          .returning('id');
        if (paymentRecord.length === 0) {
          throw new InternalServerErrorException('payment record not created');
        }
      } catch (err) {
        throw err;
      }
    });

    return data.data.authorization_url as string;
  }

  async verifyPayment(data: any) {
    // make request to the verify transaction endpoint
    // const apiKey = this.configService.get<string>('paystack_secret_key');
    // const { data: verifyData } = await firstValueFrom(
    //   this.httpService.get(
    //     `https://api.paystack.co/transaction/verify/${data.reference}`,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${apiKey}`,
    //         'Content-Type': 'application/json',
    //       },
    //     },
    //   ),
    // );
    // // if the payment didn't go through, update the payment record and set it to failed
    // // if (verifyData.data.status !== 'success')
    const [payment] = await this.knex<Payment>(TableName.PAYMENTS)
      .where({ txn_reference: data.reference })
      .leftJoin('orders', 'payments.order_id', 'orders.id')
      .leftJoin('carts', 'orders.user_id', 'carts.user_id')
      .leftJoin('users', 'orders.user_id', 'users.id')
      .select(
        'payments.status as payment_status',
        'payments.amount',
        'payments.order_id',
        'orders.user_id',
        'orders.status as order_status',
        'users.email',
        'carts.id as cart_id',
      );
    if (!payment) {
      throw new BadRequestException('payment not found');
    }
    if (payment.payment_status === PaymentStatus.SUCCESSFUL) {
      return;
    }
    if (
      data.status === 'success' &&
      Number(data.amount) === Number(payment.amount) &&
      data.paid_at !== null
    ) {
      await this.knex.transaction(async (trx) => {
        try {
          await trx<Payment>(TableName.PAYMENTS)
            .where({ txn_reference: data.reference })
            .update({
              status: PaymentStatus.SUCCESSFUL,
              payment_channel: data.channel,
              currency: data.currency,
              provider: PaymentProvider.PAYSTACK,
              paid_at: data.paid_at,
            } as Payment);

          await trx<Order>(TableName.ORDERS)
            .where({ id: payment.order_id })
            .update({ status: OrderStatus.COMPLETED } as Order);

          await trx<CartItem>(TableName.CART_ITEMS)
            .where({ cart_id: payment.cart_id })
            .delete();
        } catch (err) {
          throw err;
        }
      });
      // send a confirmation email
      const readableDate = new Date(data.paid_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      await this.emailQueue.add(EmailTypes.ORDER_CONFIRMATION, {
        order_id: payment.order_id,
        date: readableDate,
        total: payment.amount,
        email: payment.email,
        payment_method: payment.channel,
        currency: payment.currency,
        orders: [
          {
            //order item
            name: '',
            price: '',
            quantity: '',
            total: '',
          },
        ],
      });
      this.logger.log('info', 'payment verification successful');
    }
  }

  async updatePendingOrders() {
    // get all payments that are pending
    const payments = await this.knex<Payment>(TableName.PAYMENTS)
      .where('status', PaymentStatus.PENDING)
      .andWhere('created_at', '<', new Date(Date.now() - 60 * 60 * 1000))
      .select('txn_reference', 'amount', 'order_id');
    for (const payment of payments) {
      // make request to the verify transaction endpoint
      const apiKey = this.configService.get<string>('paystack_secret_key');
      const { data } = await firstValueFrom(
        this.httpService.get(
          `https://api.paystack.co/transaction/verify/${payment.txn_reference}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      // if the payment didn't go through, update the payment record and set it to failed
      if (data.data.status !== 'success') {
        await this.knex.transaction(async (trx) => {
          await trx<Payment>(TableName.PAYMENTS)
            .where({ txn_reference: payment.txn_reference })
            .update({
              status: PaymentStatus.FAILED,
            } as Payment);
          await trx<Order>(TableName.ORDERS)
            .where('id', payment.order_id)
            .update({ status: OrderStatus.CANCELLED } as Order);
        });
      }
    }
    // update the status of orders that have not been paid for
  }
}
