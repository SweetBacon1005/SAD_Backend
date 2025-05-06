import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../database/prisma.module';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {} 