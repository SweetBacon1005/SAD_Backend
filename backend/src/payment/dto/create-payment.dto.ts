import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
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
    description: 'Số tiền thanh toán',
    example: 150000,
  })
  @IsNotEmpty({ message: 'Số tiền thanh toán không được để trống' })
  @IsNumber({}, { message: 'Số tiền thanh toán phải là số' })
  amount: number;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    example: PaymentMethod.VNPAY,
  })
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  method: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Địa chỉ IP của khách hàng (cho thanh toán trực tuyến)',
    example: '127.0.0.1',
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ IP phải là chuỗi' })
  ipAddr?: string;

  @ApiPropertyOptional({
    description: 'Thông tin bổ sung',
    example: 'Ghi chú thanh toán',
  })
  @IsOptional()
  @IsString({ message: 'Thông tin bổ sung phải là chuỗi' })
  note?: string;
} 