import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @ApiProperty({
    description: 'ID của sản phẩm',
    example: '60d5ec9d2b5b82a5d5000001',
    required: false,
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({
    description: 'ID của item trong giỏ hàng',
    example: '60d5ec9d2b5b82a5d5000002',
    required: false,
  })
  @IsOptional()
  @IsString()
  cartItemId?: string;

  @ApiProperty({
    description: 'ID của biến thể sản phẩm',
    example: '60d5ec9d2b5b82a5d5000003',
    required: false,
  })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({
    description: 'Số lượng',
    example: 2,
  })
  @IsNumber()
  quantity: number;
}

export class ShippingInfoDto {
  @ApiProperty({
    description: 'Địa chỉ giao hàng',
    example: '123 Nguyễn Văn A, Quận 1, TP HCM',
  })
  @IsNotEmpty()
  @IsString()
  addressLine: string;

  @ApiProperty({
    description: 'Số điện thoại liên hệ',
    example: '0123456789',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Mảng các sản phẩm trong đơn hàng',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Thông tin giao hàng',
    type: ShippingInfoDto,
  })
  @ValidateNested()
  @Type(() => ShippingInfoDto)
  shippingInfo: ShippingInfoDto;

  @ApiProperty({
    description: 'ID của voucher (không phải code)',
    example: '60d5ec9d2b5b82a5d5000007',
    required: false,
  })
  @IsOptional()
  @IsString()
  voucherId?: string;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    example: PaymentMethod.COD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Ghi chú đơn hàng',
    example: 'Giao hàng giờ hành chính',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
} 