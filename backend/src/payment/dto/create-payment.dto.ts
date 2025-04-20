import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID đơn hàng',
    example: '6151f3d2e149e32b3404c8b5',
  })
  @IsNotEmpty({ message: 'ID đơn hàng không được để trống' })
  @IsString({ message: 'ID đơn hàng phải là chuỗi' })
  orderId: string;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    example: PaymentMethod.VNPAY,
  })
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toán đơn hàng #12345',
  })
  @IsOptional()
  @IsString({ message: 'Thông tin đơn hàng phải là chuỗi' })
  orderInfo?: string;
} 