import { ApiProperty } from '@nestjs/swagger';

export class ComparisonFeatureDto {
  @ApiProperty({
    description: 'Tên thuộc tính so sánh',
    example: 'Chất liệu',
  })
  name: string;

  @ApiProperty({
    description: 'Giá trị thuộc tính của từng sản phẩm theo thứ tự',
    example: ['Cotton', 'Polyester', 'Linen'],
    type: [String],
  })
  values: string[];
}

export class ComparisonVariantDto {
  @ApiProperty({
    description: 'ID biến thể',
    example: '6151f3d2e149e32b3404c8c7',
  })
  id: string;

  @ApiProperty({
    description: 'Tên biến thể sản phẩm',
    example: 'Size M - Màu Đỏ',
  })
  name: string;

  @ApiProperty({
    description: 'Mô tả biến thể',
    example: 'Size M màu đỏ, phù hợp với người từ 50-60kg',
  })
  description: string;

  @ApiProperty({
    description: 'Giá bán',
    example: 150000,
  })
  price: number;

  @ApiProperty({
    description: 'Giá nhập',
    example: 100000,
  })
  costPrice: number;

  @ApiProperty({
    description: 'Số lượng tồn kho',
    example: 50,
  })
  quantity: number;

  @ApiProperty({
    description: 'Thuộc tính bổ sung',
    example: { color: 'Đỏ', size: 'M', material: 'Cotton' },
  })
  attributes: Record<string, any>;

  @ApiProperty({
    description: 'Danh sách hình ảnh',
    example: ['url1.jpg', 'url2.jpg'],
  })
  images: string[];
}

export class ProductComparisonItemDto {
  @ApiProperty({
    description: 'ID sản phẩm',
    example: '6151f3d2e149e32b3404c8b5',
  })
  id: string;

  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Áo Thun Oversize',
  })
  name: string;

  @ApiProperty({
    description: 'Đường dẫn slug của sản phẩm',
    example: 'ao-thun-oversize',
  })
  slug: string;

  @ApiProperty({
    description: 'Giá sản phẩm',
    example: 120000,
  })
  price: number;

  @ApiProperty({
    description: 'Hình ảnh đại diện của sản phẩm',
    example: 'url1.jpg',
  })
  image: string;

  @ApiProperty({
    description: 'Mô tả ngắn của sản phẩm',
    example: 'Áo thun oversize phong cách Hàn Quốc',
  })
  description: string;

  @ApiProperty({
    description: 'Đánh giá trung bình của sản phẩm (1-5)',
    example: 4.5,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Số lượng đánh giá',
    example: 12,
  })
  reviewCount: number;

  @ApiProperty({
    description: 'Số lượng biến thể sản phẩm',
    example: 3,
  })
  variantCount: number;

  @ApiProperty({
    description: 'Các biến thể của sản phẩm',
    type: [ComparisonVariantDto],
  })
  variants: ComparisonVariantDto[];
}

export class ProductComparisonResponseDto {
  @ApiProperty({
    description: 'Danh sách sản phẩm được so sánh',
    type: [ProductComparisonItemDto],
  })
  products: ProductComparisonItemDto[];

  @ApiProperty({
    description: 'Bảng so sánh các thuộc tính sản phẩm',
    type: [ComparisonFeatureDto],
  })
  features: ComparisonFeatureDto[];

  @ApiProperty({
    description: 'Thông tin khuyến nghị sản phẩm tốt nhất (nếu có phân tích)',
    example: {
      bestValue: '6151f3d2e149e32b3404c8b5',
      bestQuality: '6151f3d2e149e32b3404c8b6',
    },
  })
  recommendations: Record<string, string>;

  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Tổng số trang',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Tổng số kết quả',
    example: 45,
  })
  total: number;
} 