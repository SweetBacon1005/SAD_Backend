import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVnpayPaymentDto {
  @ApiProperty({
    description: 'ID đơn hàng',
    example: '6151f3d2e149e32b3404c8b5',
  })
  @IsNotEmpty({ message: 'ID đơn hàng không được để trống' })
  @IsString({ message: 'ID đơn hàng phải là chuỗi' })
  orderId: string;

  @ApiProperty({
    description: 'Số tiền thanh toán (đơn vị VNĐ)',
    example: 150000,
  })
  @IsNotEmpty({ message: 'Số tiền không được để trống' })
  @IsNumber({}, { message: 'Số tiền phải là số' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toán đơn hàng #12345',
  })
  @IsOptional()
  @IsString({ message: 'Thông tin đơn hàng phải là chuỗi' })
  orderInfo?: string;

  @ApiPropertyOptional({
    description: 'Loại hình thanh toán',
    example: '190000',
    default: '190000',
  })
  @IsOptional()
  @IsString({ message: 'Loại hình thanh toán phải là chuỗi' })
  orderType?: string;

  @ApiPropertyOptional({
    description: 'Ngôn ngữ hiển thị trang thanh toán',
    example: 'vn',
    default: 'vn',
  })
  @IsOptional()
  @IsString({ message: 'Ngôn ngữ phải là chuỗi' })
  locale?: string;

  @ApiPropertyOptional({
    description: 'Địa chỉ IP của khách hàng',
    example: '127.0.0.1',
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ IP phải là chuỗi' })
  ipAddr?: string;
} 