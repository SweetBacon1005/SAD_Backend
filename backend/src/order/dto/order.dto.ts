import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ShippingInfoDto {
  @ApiProperty({
    description: 'Địa chỉ giao hàng',
    example: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
  })
  @IsString()
  @MinLength(3)
  addressLine: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại liên hệ',
    example: '0901234567',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Thành phố', example: 'TP. Hồ Chí Minh' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Tỉnh/Thành phố', example: 'Hồ Chí Minh' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Quốc gia', example: 'Việt Nam' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Mã bưu điện', example: '700000' })
  @IsString()
  @IsOptional()
  postalCode?: string;
}

export class OrderItemDto {
  @ApiPropertyOptional({
    description: 'ID của item trong giỏ hàng',
    example: '6151f3d2e149e32b3404c8c3',
  })
  @IsOptional()
  @IsString()
  cartItemId?: string;

  @ApiProperty({
    description: 'ID sản phẩm',
    example: '6151f3d2e149e32b3404c8b5',
  })
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    description: 'ID biến thể sản phẩm (nếu có)',
    example: '6151f3d2e149e32b3404c8c7',
  })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ description: 'Số lượng đặt hàng', minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Danh sách sản phẩm trong đơn hàng',
    type: [OrderItemDto],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
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
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'ID của voucher được áp dụng',
    example: '6151f3d2e149e32b3404c8d5',
  })
  @IsString()
  @IsOptional()
  voucherId?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú cho đơn hàng',
    example: 'Giao hàng ngoài giờ hành chính',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới của đơn hàng',
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới của thanh toán',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Mã giao dịch từ cổng thanh toán',
    example: 'txn_1K2OafLkdIwDEn78AFYmpL9Z',
  })
  @IsString()
  @IsOptional()
  transactionId?: string;
}

export class OrderIdParamDto {
  @ApiProperty({
    description: 'ID của đơn hàng',
    example: '6151f3d2e149e32b3404c8b9'
  })
  @IsString()
  id: string;
}
