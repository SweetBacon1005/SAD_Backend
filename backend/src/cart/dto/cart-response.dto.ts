import { ApiProperty } from '@nestjs/swagger';

// DTO cho Cart Item
export class CartItemResponseDto {
  @ApiProperty({
    description: 'ID của item trong giỏ hàng',
    example: '6151f3d2e149e32b3404c8e1',
  })
  id: string;

  @ApiProperty({
    description: 'ID của sản phẩm',
    example: '6151f3d2e149e32b3404c8b5',
  })
  productId: string;

  @ApiProperty({
    description: 'ID của biến thể sản phẩm đã chọn (nếu có)',
    example: '6151f3d2e149e32b3404c8c7',
    required: false,
  })
  variantId?: string;

  @ApiProperty({
    description: 'Giá đã chọn của sản phẩm hoặc biến thể',
    example: 120000,
  })
  selectedPrice: number;

  @ApiProperty({
    description: 'Số lượng sản phẩm',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Thời gian thêm vào giỏ hàng',
    example: '2023-04-05T10:30:40.000Z',
  })
  addedAt: string;

  @ApiProperty({
    description: 'Thông tin sản phẩm',
    example: {
      id: '6151f3d2e149e32b3404c8b5',
      name: 'Áo Thun Oversize',
      basePrice: 120000,
      images: ['url1.jpg'],
      store: {
        id: '6151f3d2e149e32b3404c8a5',
        name: 'Fashion Store',
      },
      variants: [
        {
          id: '6151f3d2e149e32b3404c8c7',
          name: 'Size M - Màu Đỏ',
          price: 120000,
          quantity: 50,
          isSelected: true,
        },
      ],
      selectedVariant: {
        id: '6151f3d2e149e32b3404c8c7',
        name: 'Size M - Màu Đỏ',
        price: 120000,
        quantity: 50,
      },
    },
  })
  product: {
    id: string;
    name: string;
    basePrice: number;
    images: string[];
    store?: {
      id: string;
      name: string;
    };
    variants: {
      id: string;
      name: string;
      price: number;
      quantity: number;
      isSelected?: boolean;
    }[];
    selectedVariant?: {
      id: string;
      name: string;
      price: number;
      quantity: number;
    } | null;
  };

  @ApiProperty({
    description: 'Tổng giá của item (số lượng x giá)',
    example: 240000,
  })
  totalPrice: number;
}

// DTO cho Cart
export class CartResponseDto {
  @ApiProperty({
    description: 'ID giỏ hàng',
    example: '6151f3d2e149e32b3404c8e0',
  })
  id: string;

  @ApiProperty({
    description: 'ID người dùng sở hữu giỏ hàng',
    example: '6151f3d2e149e32b3404c8d0',
  })
  userId: string;

  @ApiProperty({
    description: 'Danh sách sản phẩm trong giỏ hàng',
    type: [CartItemResponseDto],
  })
  items: CartItemResponseDto[];

  @ApiProperty({
    description: 'Metadata của giỏ hàng',
    example: { notes: 'Giao hàng vào buổi tối', couponCode: 'SUMMER10' },
    required: false,
  })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Thời gian tạo giỏ hàng',
    example: '2023-04-05T10:30:40.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Thời gian cập nhật giỏ hàng gần nhất',
    example: '2023-04-05T10:30:40.000Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Tổng số lượng sản phẩm trong giỏ hàng',
    example: 5,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Tổng giá trị giỏ hàng',
    example: 600000,
  })
  totalAmount: number;
}

// DTO cho Cart Item đã được thêm vào giỏ
export class AddCartItemResponseDto {
  @ApiProperty({
    description: 'ID của item trong giỏ hàng',
    example: '6151f3d2e149e32b3404c8e1',
  })
  id: string;

  @ApiProperty({
    description: 'ID của giỏ hàng',
    example: '6151f3d2e149e32b3404c8e0',
  })
  cartId: string;

  @ApiProperty({
    description: 'ID của sản phẩm',
    example: '6151f3d2e149e32b3404c8b5',
  })
  productId: string;

  @ApiProperty({
    description: 'ID của biến thể sản phẩm đã chọn (nếu có)',
    example: '6151f3d2e149e32b3404c8c7',
    required: false,
  })
  variantId?: string;

  @ApiProperty({
    description: 'Giá đã chọn của sản phẩm hoặc biến thể',
    example: 120000,
  })
  selectedPrice: number;

  @ApiProperty({
    description: 'Số lượng sản phẩm',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Thời gian thêm vào giỏ hàng',
    example: '2023-04-05T10:30:40.000Z',
  })
  addedAt: string;

  @ApiProperty({
    description: 'Thông tin sản phẩm',
    example: {
      id: '6151f3d2e149e32b3404c8b5',
      name: 'Áo Thun Oversize',
      basePrice: 120000,
      images: ['url1.jpg'],
      store: {
        id: '6151f3d2e149e32b3404c8a5',
        name: 'Fashion Store',
      },
      selectedVariant: {
        id: '6151f3d2e149e32b3404c8c7',
        name: 'Size M - Màu Đỏ',
        price: 120000,
        quantity: 50,
      }
    },
  })
  product: {
    id: string;
    name: string;
    basePrice: number;
    images: string[];
    store?: {
      id: string;
      name: string;
    };
    selectedVariant?: {
      id: string;
      name: string;
      price: number;
      quantity: number;
    } | null;
  };

  @ApiProperty({
    description: 'Tổng giá của item (số lượng x giá)',
    example: 240000,
  })
  totalPrice: number;
}

// DTO cho Clear Cart Response
export class ClearCartResponseDto extends CartResponseDto {}

// DTO cho Update Cart Response
export class UpdateCartResponseDto extends CartResponseDto {}

// DTO cho Thêm Item Response
export class RemoveCartItemResponseDto {
  @ApiProperty({
    description: 'ID của item đã xóa',
    example: '6151f3d2e149e32b3404c8e1',
  })
  id: string;

  @ApiProperty({
    description: 'Trạng thái xóa',
    example: true,
  })
  deleted: boolean;
} 