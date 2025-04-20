import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '@/user/user.module';
import { PrismaService } from '../database/prisma.service';
import { VoucherModule } from '../voucher/voucher.module';

@Module({
  imports: [AuthModule, UserModule, VoucherModule],
  controllers: [OrderController],
  providers: [OrderService, PrismaService],
  exports: [OrderService],
})
export class OrderModule {}
