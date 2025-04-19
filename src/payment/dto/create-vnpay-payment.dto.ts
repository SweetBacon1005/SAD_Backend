import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVnpayPaymentDto {
  @ApiProperty({
    description: 'Mã đơn hàng',
    example: 'ORDER_123456',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Số tiền thanh toán (VND)',
    example: 100000,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toan don hang ORDER_123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  orderInfo?: string;

  @ApiProperty({
    description: 'Loại đơn hàng',
    example: 'other',
    required: false,
  })
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiProperty({
    description: 'Ngôn ngữ',
    example: 'vn',
    required: false,
  })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({
    description: 'Mã ngân hàng',
    example: 'NCB',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiProperty({
    description: 'Địa chỉ IP của người dùng',
    example: '127.0.0.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipAddr?: string;
} 