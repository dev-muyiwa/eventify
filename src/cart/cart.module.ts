import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from '../user/user.module';
import { BullTypes } from '../config/types';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({ name: BullTypes.EMAIL }),
    HttpModule,
    UserModule,
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
