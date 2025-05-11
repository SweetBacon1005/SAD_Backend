import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({ description: 'ID người dùng', example: '6151f3d2e149e32b3404c8b5' })
  id: string;

  @ApiProperty({ description: 'Tên người dùng', example: 'Nguyễn Văn A' })
  name: string;
}

class ProductDto {
  @ApiProperty({ description: 'ID sản phẩm', example: '6151f3d2e149e32b3404c8b5' })
  id: string;

  @ApiProperty({ description: 'Tên sản phẩm', example: 'Áo Thun Oversize' })
  name: string;

  @ApiPropertyOptional({ description: 'Hình ảnh sản phẩm', example: 'image.jpg' })
  image: string | null;

  @ApiPropertyOptional({ description: 'Giá gốc', example: 100000 })
  basePrice: number;
}

export class ReviewResponseDto {
  @ApiProperty({ description: 'ID đánh giá', example: '6151f3d2e149e32b3404c8b5' })
  id: string;

  @ApiProperty({ description: 'Đánh giá sao (1-5)', example: 5 })
  rating: number;

  @ApiProperty({ description: 'Tiêu đề đánh giá', example: 'Sản phẩm rất tốt' })
  title: string;

  @ApiProperty({ description: 'Nội dung đánh giá', example: 'Sản phẩm đúng như mô tả, chất lượng tốt, giao hàng nhanh' })
  comment: string;

  @ApiPropertyOptional({ description: 'Danh sách hình ảnh kèm theo đánh giá', type: [String], example: ['url1.jpg', 'url2.jpg'] })
  images: string[];

  @ApiPropertyOptional({ description: 'Thông tin người dùng', type: UserDto })
  user?: UserDto;

  @ApiPropertyOptional({ description: 'Thông tin sản phẩm', type: ProductDto })
  product?: ProductDto;

  @ApiProperty({ description: 'Ngày tạo', example: '2023-04-01T10:30:40.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Ngày cập nhật', example: '2023-04-02T15:45:22.000Z' })
  updatedAt: Date | null;
} 