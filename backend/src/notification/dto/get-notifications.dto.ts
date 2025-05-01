import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetNotificationsDto {
  @ApiHideProperty()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Số trang',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  currentPage?: number = 1;

  @ApiProperty({
    description: 'Số lượng thông báo mỗi trang',
    required: false,
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 10;

  @ApiProperty({
    description: 'Lọc theo trạng thái đã đọc',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
