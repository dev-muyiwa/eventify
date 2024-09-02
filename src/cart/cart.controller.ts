import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartItemDto } from './dto/create-cart.dto';
import { Request, Response } from 'express';
import { User } from '../user/entities/user.entity';
import { success } from '../util/function';
import * as crypto from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WebHookDto } from './dto/webhook.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipAuthorization } from '../auth/guards/jwt.guard';
import { Cron, CronExpression } from '@nestjs/schedule';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('carts')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post()
  async addTicketToCart(
    @Req() req: Request,
    @Body() createCartItemDto: CreateCartItemDto,
  ) {
    const user = req.user as User;
    const cartItem = await this.cartService.addItemToCart(
      user.id,
      createCartItemDto,
    );

    return success(cartItem, 'ticket added to cart');
  }

  @Get()
  async getMyCart(@Req() req: Request) {
    const user = req.user as User;
    const cart = await this.cartService.getItemsInCart(user.id);

    return success(cart, 'cart items retrieved');
  }

  @Post('checkout')
  async checkoutCart(@Req() req: Request) {
    const user = req.user as User;
    // create order and order items
    const url = await this.cartService.checkoutCart(user);

    return success({ redirect_url: url }, 'checkout initiated');
  }

  @SkipAuthorization()
  @Post('verify-payment-webhook')
  async verifyCartCheckout(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: WebHookDto,
  ) {
    const secret = this.configService.get('paystack_secret_key');
    //validate event
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(data))
      .digest('hex');
    // acknowledge the request
    if (hash == req.headers['x-paystack-signature']) {
      // verify the transaction
      if (data.event == 'charge.success' && data.data.status === 'success') {
        this.logger.info(`Payment request success: ${data}`, data);
        // only update the payment status if the payment was successful and the db record is not already updated
        await this.cartService.verifyPayment(data.data);
        res.status(HttpStatus.OK).send();
      } else {
        this.logger.error('Invalid webhook request: Invalid event', data);
        res.status(HttpStatus.BAD_REQUEST).send();
      }
    } else {
      this.logger.error('Invalid webhook request: Signature mismatch', data);
      res.status(HttpStatus.BAD_REQUEST).send();
    }
  }

  //   cron job to update the status of orders that have not been paid for
  @Cron(CronExpression.EVERY_30_MINUTES)
  async updatePendingOrders() {
    this.logger.info('Updating pending orders');
    await this.cartService.updatePendingOrders();
  }
}
