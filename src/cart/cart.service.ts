import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateCartItemDto } from './dto/create-cart.dto';
import { KNEX_CONNECTION } from '../database/knexfile';
import { Knex } from 'knex';
import { Cart, CartItem, Payment } from './entities/cart.entity';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { User } from '../user/entities/user.entity';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { UserService } from '../user/user.service';
import { Ticket } from '../events/entities/event.entity';
import { TicketNotFoundException } from '../events/events.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class CartService {
  private readonly cartQuery;
  private readonly cartItemQuery;
  private readonly paymentQuery;

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.cartQuery = knex<Cart>('carts');
    this.cartItemQuery = knex<CartItem>('cart_items');
    this.paymentQuery = knex<Payment>('payments');
  }

  async addItemToCart(userId: string, item: CreateCartItemDto) {
    const [cart] = await this.cartQuery.clone()
      // .insert({
      .where({
        user_id: userId,
      })
      .returning('*');
    // .onConflict('user_id')
    // .ignore()
    // .returning('*')
    // .then(([cart]) => cart);

    const [ticket] = await this.knex<Ticket>('tickets')
      .where({ id: item.ticket_id })
      .select('*');
    if (!ticket) {
      throw new TicketNotFoundException();
    }

    return this.knex.transaction(async (trx) => {
      const [cartItem] = await this.cartItemQuery.clone()
        .insert({
          ticket_id: ticket.id,
          attendee_info: item.attendee,
          cart_id: cart.id,
        } as CartItem)
        .returning('*')
        .transacting(trx);

      // update the cart pricing
      await this.cartQuery
        .clone()
        .where({ id: cart.id })
        .update({
          total_amount: Number(cart.total_amount) + Number(ticket.price),
        })
        .transacting(trx)
        .then(trx.commit)
        .catch(trx.rollback);

      return cartItem;
    });
  }

  async getItemsInCart(userId: string) {
    const cart = await this.cartItemQuery.clone()
      .select('cart_items.*', this.knex.raw('SUM(tickets.price) as price'))
      .from('cart_items')
      .leftJoin('tickets', 'cart_items.ticket_id', 'tickets.id')
      .leftJoin('carts', 'cart_items.cart_id', 'carts.id')
      .where('carts.user_id', userId)
      .groupBy('cart_items.id', 'cart_items.created_at')
      .orderBy('cart_items.created_at', 'DESC')
      .then((results) => {
        return {
          items: results,
          total: results.reduce(
            (acc, item) => Number(acc) + Number(item.price),
            0,
          ),
        };
      });

    return cart;
  }

  async checkoutCart(user: User) {
    const [cart] = await this.cartQuery.clone().where({ user_id: user.id }).select('*');
    // make api request to paystack to initialize txn, attaching email and amount
    const apiKey = this.configService.get<string>('paystack_secret_key');
    const { data } = await firstValueFrom(
      this.httpService.post(
        'https://api.paystack.co/transaction/initialize',
        {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          amount: Number(cart.total_amount) * 100,
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
    // const jsonData = JSON.parse(data);
    // this.logger.error(`Paystack response`, { ref: data.data.authorization_url, reference: data.data.reference });
    // create a payment record
    await this.paymentQuery
      .clone()
      .insert({
        amount: cart.total_amount,
        payment_method: 'paystack',
        txn_reference: data.data.reference,
        cart_id: cart.id,
        currency: 'NGN',
        paid_at: new Date(),
      } as Payment)
      .returning('*');

    return data.data.authorization_url as string;
  }

  async verifyPayment(data: any) {
    // make request to the verify transaction endpoint
    const apiKey = this.configService.get<string>('paystack_secret_key');
    const { data: verifyData } = await firstValueFrom(
      this.httpService.get(
        `https://api.paystack.co/transaction/verify/${data.reference}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
    // if the payment didn't go through, update the payment record and set it to failed
    // if (verifyData.data.status !== 'success')
    const [payment] = await this.paymentQuery
      .clone().where({ txn_reference: data.reference }).select('*');
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }
    if (payment.status === 'paid') {
      return;
    }
    if (
      data.status === 'success' &&
      Number(data.amount) == Number(payment.amount * 100)
    ) {
      await this.knex.transaction(async (trx) => {
        await this.paymentQuery
          .clone()
          .where({ txn_reference: data.reference })
          .update({
            status: 'paid',
          })
          .transacting(trx);
      //   create reservation record
        await this.knex('ticket_reservations')
          .clone()
      //   clear the cart
        await this.cartItemQuery
          .clone()
          .where({ cart_id: payment.cart_id })
          .delete()
          .transacting(trx)
          .then(trx.commit)
          .catch(trx.rollback);
      });
      // create a ticket reservation
      // send a confirmation email
    }
    // find the user by email
    // find their payment by reference
    // process the new record addition if status is not paid
    //   update the payment status
    //   create a ticket reservation
    //   send a confirmation email using the queue
  //   clear their cart
  }
}
