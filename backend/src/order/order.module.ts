import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
