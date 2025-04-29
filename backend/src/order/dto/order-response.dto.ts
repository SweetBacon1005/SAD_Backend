import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export class ProductBasicDto {
  @ApiProperty({ description: 'ID của sản phẩm', example: '6151f3d2e149e32b3404c8b5' })
  id: string;

  @ApiProperty({ description: 'Tên sản phẩm', example: 'Áo Thun Oversize' })
  name: string;

  @ApiProperty({ description: 'Giá cơ bản', example: 120000 })
  basePrice: number;
  
  @ApiProperty({ description: 'Ảnh đại diện', example: ['url1.jpg'] })
  images: string[];
}

export class OrderItemResponseDto {
  @ApiProperty({ description: 'ID của item', example: '6151f3d2e149e32b3404c8c3' })
  id: string;

  @ApiProperty({ description: 'ID của đơn hàng', example: '6151f3d2e149e32b3404c8b9' })
  orderId: string;

  @ApiProperty({ description: 'ID của sản phẩm', example: '6151f3d2e149e32b3404c8b5' })
  productId: string;
  
  @ApiPropertyOptional({ 
    description: 'ID của biến thể sản phẩm (nếu có)', 
    example: '6151f3d2e149e32b3404c8c7' 
  })
  variantId?: string;

  @ApiProperty({ description: 'Số lượng', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Giá sản phẩm tại thời điểm đặt hàng', example: 150000 })
  price: number;
  
  @ApiPropertyOptional({
    description: 'Thuộc tính của biến thể (màu sắc, kích cỡ...)',
    example: { color: 'Đỏ', size: 'M' },
  })
  attributes?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Thông tin sản phẩm', type: ProductBasicDto })
  product?: ProductBasicDto;
}

export class ShippingInfoResponseDto {
  @ApiProperty({ description: 'ID của thông tin giao hàng', example: '6151f3d2e149e32b3404c8c5' })
  id: string;

  @ApiProperty({ description: 'Địa chỉ giao hàng', example: '123 Đường Lê Lợi, Phường Bến Nghé' })
  addressLine: string;

  @ApiPropertyOptional({ description: 'Số điện thoại', example: '0901234567' })
  phone?: string | null;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'ID của thanh toán', example: '6151f3d2e149e32b3404c8c7' })
  id: string;

  @ApiProperty({ description: 'ID của đơn hàng', example: '6151f3d2e149e32b3404c8b9' })
  orderId: string;

  @ApiProperty({ 
    description: 'Trạng thái thanh toán', 
    enum: PaymentStatus, 
    example: PaymentStatus.PAID 
  })
  status: PaymentStatus;

  @ApiProperty({ 
    description: 'Phương thức thanh toán', 
    enum: PaymentMethod, 
    example: PaymentMethod.CREDIT_CARD 
  })
  method: PaymentMethod;

  @ApiPropertyOptional({ 
    description: 'Mã giao dịch', 
    example: 'txn_1K2OafLkdIwDEn78AFYmpL9Z' 
  })
  transactionId?: string | null;

  @ApiProperty({ description: 'Tổng số tiền', example: 300000 })
  amount: number;

  @ApiProperty({ description: 'Ngày tạo thanh toán', example: '2023-04-01T10:30:40.000Z' })
  createdAt: Date;
}

export class UserBasicDto {
  @ApiProperty({ description: 'ID người dùng', example: '6151f3d2e149e32b3404c8b7' })
  id: string;

  @ApiProperty({ description: 'Tên người dùng', example: 'Nguyễn Văn A' })
  name: string;

  @ApiProperty({ description: 'Email người dùng', example: 'nguyenvana@example.com' })
  email: string;
}

export class OrderResponseDto {
  @ApiProperty({ description: 'ID đơn hàng', example: '6151f3d2e149e32b3404c8b9' })
  id: string;

  @ApiProperty({ description: 'ID người dùng', example: '6151f3d2e149e32b3404c8b7' })
  userId: string;

  @ApiProperty({ 
    description: 'Trạng thái đơn hàng', 
    enum: OrderStatus, 
    example: OrderStatus.PROCESSING 
  })
  status: OrderStatus;

  @ApiProperty({ description: 'Tổng giá trị sản phẩm', example: 300000 })
  subtotal: number;

  @ApiPropertyOptional({ 
    description: 'Số tiền giảm giá từ voucher', 
    example: 30000 
  })
  discountAmount?: number;

  @ApiPropertyOptional({ 
    description: 'ID của voucher đã áp dụng', 
    example: '6151f3d2e149e32b3404c8d5' 
  })
  voucherId?: string;

  @ApiProperty({ description: 'Tổng giá trị đơn hàng', example: 270000 })
  total: number;

  @ApiProperty({ description: 'ID thông tin giao hàng', example: '6151f3d2e149e32b3404c8c5' })
  shippingInfoId: string;

  @ApiProperty({ 
    description: 'Trạng thái thanh toán', 
    enum: PaymentStatus, 
    example: PaymentStatus.PAID 
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({ 
    description: 'Phương thức thanh toán', 
    enum: PaymentMethod, 
    example: PaymentMethod.CREDIT_CARD 
  })
  paymentMethod: PaymentMethod | null;

  @ApiPropertyOptional({ 
    description: 'Ghi chú đơn hàng', 
    example: 'Giao hàng trong giờ hành chính' 
  })
  notes?: string | null;

  @ApiPropertyOptional({ 
    description: 'Dự kiến ngày giao hàng', 
    example: '2023-04-10T10:30:40.000Z' 
  })
  estimatedDeliveryDate?: Date | null;

  @ApiPropertyOptional({ 
    description: 'Ngày vận chuyển', 
    example: '2023-04-05T10:30:40.000Z' 
  })
  shippedAt?: Date | null;

  @ApiPropertyOptional({ 
    description: 'Ngày giao hàng', 
    example: '2023-04-07T10:30:40.000Z' 
  })
  deliveredAt?: Date | null;

  @ApiProperty({ description: 'Ngày tạo đơn hàng', example: '2023-04-01T10:30:40.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Ngày cập nhật đơn hàng', example: '2023-04-02T15:45:22.000Z' })
  updatedAt?: Date | null;

  @ApiProperty({ description: 'Danh sách sản phẩm', type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ description: 'Thông tin giao hàng', type: ShippingInfoResponseDto })
  shippingInfo: ShippingInfoResponseDto;

  @ApiPropertyOptional({ description: 'Thông tin thanh toán', type: PaymentResponseDto })
  payment?: PaymentResponseDto | null;

  @ApiPropertyOptional({ description: 'Thông tin người dùng', type: UserBasicDto })
  user?: UserBasicDto;
}

export class OrderListResponseDto {
  @ApiProperty({ description: 'Danh sách đơn hàng', type: [OrderResponseDto] })
  orders: OrderResponseDto[];
}

export class OrderStatusResponseDto {
  @ApiProperty({ description: 'ID đơn hàng', example: '6151f3d2e149e32b3404c8b9' })
  id: string;

  @ApiProperty({ 
    description: 'Trạng thái đơn hàng mới', 
    enum: OrderStatus, 
    example: OrderStatus.PROCESSING 
  })
  status: OrderStatus;

  @ApiProperty({ description: 'Ngày cập nhật trạng thái', example: '2023-04-02T15:45:22.000Z' })
  updatedAt: Date | null;
}

export class PaymentStatusResponseDto {
  @ApiProperty({ description: 'ID đơn hàng', example: '6151f3d2e149e32b3404c8b9' })
  id: string;

  @ApiProperty({ 
    description: 'Trạng thái thanh toán mới', 
    enum: PaymentStatus, 
    example: PaymentStatus.PAID 
  })
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({ description: 'Mã giao dịch', example: 'txn_1K2OafLkdIwDEn78AFYmpL9Z' })
  transactionId?: string | null;

  @ApiProperty({ description: 'Ngày cập nhật trạng thái', example: '2023-04-02T15:45:22.000Z' })
  updatedAt: Date | null;
}

export class CancelOrderResponseDto {
  @ApiProperty({ description: 'ID đơn hàng', example: '6151f3d2e149e32b3404c8b9' })
  id: string;

  @ApiProperty({ 
    description: 'Trạng thái đơn hàng', 
    enum: OrderStatus, 
    example: OrderStatus.CANCELLED 
  })
  status: OrderStatus;

  @ApiProperty({ description: 'Ngày cập nhật', example: '2023-04-02T15:45:22.000Z' })
  updatedAt: Date | null;
} 