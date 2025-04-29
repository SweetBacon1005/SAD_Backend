import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryResponseDto } from './category.dto';
import { ProductVariantResponseDto } from './product-variant.dto';

export class ProductResponseDto {
  @ApiProperty({ description: 'ID sản phẩm', example: '6151f3d2e149e32b3404c8b5' })
  id: string;

  @ApiProperty({ description: 'Tên sản phẩm', example: 'Áo Thun Oversize' })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả sản phẩm', example: 'Áo thun oversize phong cách Hàn Quốc' })
  description: string | null;

  @ApiProperty({ description: 'Giá cơ bản', example: 120000 })
  basePrice: number;

  @ApiProperty({ description: 'Danh sách danh mục', type: [CategoryResponseDto] })
  categories: CategoryResponseDto[];

  @ApiPropertyOptional({ description: 'ID cửa hàng', example: '6151f3d2e149e32b3404c8e0' })
  storeId: string | null;

  @ApiProperty({ description: 'Danh sách hình ảnh', type: [String], example: ['url1.jpg', 'url2.jpg'] })
  images: string[];

  @ApiPropertyOptional({ description: 'Thông tin bổ sung', example: { color: ['Đỏ', 'Đen'], sizes: ['S', 'M', 'L'] } })
  options: Record<string, any> | null;

  @ApiProperty({ description: 'Danh sách biến thể', type: [ProductVariantResponseDto] })
  variants: ProductVariantResponseDto[];

  @ApiProperty({ description: 'Ngày tạo', example: '2023-04-01T10:30:40.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Ngày cập nhật', example: '2023-04-02T15:45:22.000Z' })
  updatedAt: Date | null;
}

export class ProductDetailResponseDto extends ProductResponseDto {
  @ApiPropertyOptional({ description: 'Đánh giá sản phẩm', type: [Object], example: [] })
  reviews: any[];

  @ApiProperty({ description: 'Sản phẩm tương tự', type: [ProductResponseDto] })
  similars?: ProductResponseDto[];
}

export class ProductPaginationResponseDto {
  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  currentPage: number;

  @ApiProperty({ description: 'Tổng số trang', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Tổng số sản phẩm', example: 47 })
  total: number;

  @ApiProperty({ description: 'Danh sách sản phẩm', type: [ProductResponseDto] })
  data: ProductResponseDto[];
} 

export class RecommendProductsResponseDto {
  @ApiProperty({ 
      description: 'Sản phẩm được đề xuất',
      type: [ProductResponseDto]
  })
  recommends?: ProductResponseDto[];

  @ApiProperty({
      description: 'Sản phẩm phổ biến',
      type: [ProductResponseDto]
  })
  populars: ProductResponseDto[];
}
