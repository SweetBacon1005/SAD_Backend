import { Module } from '@nestjs/common';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { NotificationModule } from '@/notification/notification.module';

@Module({
  imports: [UserModule, ProductModule, NotificationModule],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
