import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { VnpayService } from './vnpay.service';
import { ConfigModule } from '@nestjs/config';
import { OrderModule } from '../order/order.module';
import { NotificationModule } from '@/notification/notification.module';

@Module({
  imports: [ConfigModule, OrderModule, NotificationModule],
  controllers: [PaymentController],
  providers: [PaymentService, VnpayService],
  exports: [PaymentService, VnpayService],
})
export class PaymentModule {} 