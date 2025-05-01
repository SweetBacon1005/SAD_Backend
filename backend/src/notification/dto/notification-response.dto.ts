import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationDto {
  @ApiProperty({ description: 'ID của thông báo' })
  id: string;

  @ApiProperty({ description: 'ID của người dùng' })
  userId: string;

  @ApiProperty({ enum: NotificationType, description: 'Loại thông báo' })
  type: NotificationType;

  @ApiProperty({ description: 'Tiêu đề thông báo' })
  title: string;

  @ApiProperty({ description: 'Nội dung thông báo' })
  message: string;

  @ApiProperty({ description: 'Trạng thái đã đọc' })
  isRead: boolean;

  @ApiProperty({ description: 'Dữ liệu bổ sung', required: false })
  data?: any;

  @ApiProperty({ description: 'Thời gian tạo' })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật',
    required: false,
    nullable: true,
  })
  updatedAt: Date | null;
}

export class GetNotificationsResponseDto {
  @ApiProperty({ type: [NotificationDto], description: 'Danh sách thông báo' })
  currentPage: number;

  @ApiProperty({ type: [NotificationDto], description: 'Danh sách thông báo' })
  pageSize: number;

  @ApiProperty({ type: [NotificationDto], description: 'Danh sách thông báo' })
  totalPages: number;

  @ApiProperty({ type: [NotificationDto], description: 'Danh sách thông báo' })
  data: NotificationDto[];
}
