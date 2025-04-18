import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentUrlDto {
  @ApiProperty({
    description: 'Mã đơn hàng',
    example: 'ORDER_123456',
  })
  @IsNotEmpty({ message: 'Mã đơn hàng không được để trống' })
  @IsString({ message: 'Mã đơn hàng phải là chuỗi' })
  orderId: string;

  @ApiProperty({
    description: 'Số tiền thanh toán (VND)',
    example: 100000,
  })
  @IsNotEmpty({ message: 'Số tiền không được để trống' })
  @IsNumber({}, { message: 'Số tiền phải là số' })
  amount: number;

  @ApiProperty({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toan don hang ORDER_123456',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Thông tin đơn hàng phải là chuỗi' })
  orderInfo?: string;

  @ApiProperty({
    description: 'Loại đơn hàng',
    example: 'other',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Loại đơn hàng phải là chuỗi' })
  orderType?: string;

  @ApiProperty({
    description: 'Ngôn ngữ',
    example: 'vn',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Ngôn ngữ phải là chuỗi' })
  locale?: string;

  @ApiProperty({
    description: 'Mã ngân hàng',
    example: 'NCB',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Mã ngân hàng phải là chuỗi' })
  bankCode?: string;

  @ApiProperty({
    description: 'Địa chỉ IP của người dùng',
    example: '127.0.0.1',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ IP phải là chuỗi' })
  ipAddr?: string;
}