import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class UpdateCartDto {
  @ApiPropertyOptional({
    description: 'Metadata của giỏ hàng (ghi chú, mã giảm giá...)',
    example: { notes: 'Giao hàng vào buổi tối', couponCode: 'SUMMER10' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 