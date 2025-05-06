import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty({
    description: 'ID của item trong giỏ hàng',
    example: '6151f3d2e149e32b3404c8e1',
  })
  id: string;

  @ApiProperty({
    description: 'ID của sản phẩm trong giỏ hàng',
    example: '6151f3d2e149e32b3404c8b5',
  })
  cartId: string;

  @ApiProperty({
    description: 'ID của biến thể sản phẩm đã chọn (nếu có)',
    example: '6151f3d2e149e32b3404c8c7',
    required: false,
  })
  variantId: string;

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
    discount?: number;
    store?: {
      id: string;
      name: string;
    };
  };

  variant: {
    id: string;
    price: number;
    quantity: number;
    attributes: Object;
  };
}

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
    description: 'Thời gian tạo giỏ hàng',
    example: '2023-04-05T10:30:40.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Thời gian cập nhật giỏ hàng gần nhất',
    example: '2023-04-05T10:30:40.000Z',
  })
  updatedAt: string;

}

export class ClearCartResponseDto extends CartResponseDto {}

export class UpdateCartResponseDto extends CartResponseDto {}

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