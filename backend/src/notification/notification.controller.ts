import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import {
  GetNotificationsResponseDto,
  NotificationDto,
} from './dto/notification-response.dto';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo thông báo mới' })
  @ApiOkResponse({
    description: 'Thông báo đã được tạo thành công',
    type: NotificationDto,
  })
  async createNotification(
    @Req() req: Request,
    @Body() payload: CreateNotificationDto,
  ): Promise<NotificationDto> {
    const userId = req['user'].id;
    return this.notificationService.createNotification({
      ...payload,
      userId,
    });
  }

  @Post('list')
  @ApiOperation({ summary: 'Lấy danh sách thông báo của user' })
  @ApiOkResponse({
    description: 'Danh sách thông báo',
    type: GetNotificationsResponseDto,
  })
  async getNotifications(
    @Req() req: Request,
    @Body() payload: GetNotificationsDto,
  ): Promise<GetNotificationsResponseDto> {
    const userId = req['user'].id;
    payload.userId = userId;
    return await this.notificationService.getNotifications(payload);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc' })
  @ApiParam({ name: 'id', description: 'ID thông báo' })
  @ApiOkResponse({
    description: 'Đánh dấu thành công',
    type: NotificationDto,
  })
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<NotificationDto> {
    const userId = req['user'].id;
    return this.notificationService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  @ApiOkResponse({
    description: 'Đánh dấu thành công',
  })
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: Request): Promise<void> {
    const userId = req['user'].id;
    await this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một thông báo' })
  @ApiParam({ name: 'id', description: 'ID thông báo' })
  @ApiOkResponse({
    description: 'Xóa thành công',
    type: NotificationDto,
  })
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<NotificationDto> {
    const userId = req['user'].id;
    return this.notificationService.deleteNotification(id, userId);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa tất cả thông báo' })
  @ApiOkResponse({
    description: 'Xóa thành công',
  })
  @HttpCode(HttpStatus.OK)
  async deleteAllNotifications(@Req() req: Request): Promise<void> {
    const userId = req['user'].id;
    await this.notificationService.deleteAllNotifications(userId);
  }
}
