import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ValidateVoucherDto {
  @ApiProperty({
    description: 'Mã voucher cần xác thực',
    example: 'SUMMER2023',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Tổng giá trị đơn hàng',
    example: 100000,
  })
  @IsNotEmpty()
  @IsNumber()
  orderTotal: number;

  @ApiProperty({
    description: 'ID của người dùng (không bắt buộc nếu là voucher công khai)',
    example: 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Danh sách ID sản phẩm trong đơn hàng (để kiểm tra điều kiện)',
    example: ['prod-123', 'prod-456'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
} 