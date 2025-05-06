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

  @ApiProperty({ description: 'Giá cơ bản', example: 120000 })
  basePrice: number;

  @ApiProperty({ description: 'Khuyến mãi', example: 10 })
  discount: number | null;

  @ApiProperty({ description: 'Danh sách hình ảnh', type: [String], example: ['url1.jpg', 'url2.jpg'] })
  images: string[];
}

export class WishlistResponseDto {
  @ApiProperty({ description: 'ID danh sách yêu thích', example: '6151f3d2e149e32b3404c8b5' })
  id: string;

  @ApiProperty({ description: 'Thông tin người dùng sở hữu', type: UserDto })
  user: UserDto;

  @ApiProperty({ description: 'Thông tin sản phẩm', type: ProductDto })
  product: ProductDto;

  @ApiProperty({ description: 'Ngày tạo', example: '2023-04-01T10:30:40.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Ngày cập nhật', example: '2023-04-02T15:45:22.000Z' })
  updatedAt?: Date;
} 