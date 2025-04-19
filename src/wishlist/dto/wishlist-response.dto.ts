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

  @ApiProperty({ description: 'Giá sản phẩm', example: 150000 })
  price: number;

  @ApiPropertyOptional({ description: 'Hình ảnh sản phẩm', example: 'image.jpg' })
  image: string | null;
}

export class WishlistItemResponseDto {
  @ApiProperty({ description: 'ID của mục yêu thích', example: '6151f3d2e149e32b3404c8b5' })
  id: string;

  @ApiProperty({ description: 'Thông tin sản phẩm', type: ProductDto })
  product: ProductDto;

  @ApiPropertyOptional({ description: 'Ghi chú', example: 'Màu đen, Size M' })
  note?: string;

  @ApiProperty({ description: 'Ngày thêm vào', example: '2023-04-01T10:30:40.000Z' })
  addedAt: Date;
}

export class WishlistResponseDto {
  @ApiProperty({ description: 'ID danh sách yêu thích', example: '6151f3d2e149e32b3404c8b5' })
  id: string;

  @ApiProperty({ description: 'Tên danh sách yêu thích', example: 'Danh sách quần áo yêu thích' })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả danh sách yêu thích', example: 'Những sản phẩm quần áo mà tôi yêu thích' })
  description?: string;

  @ApiProperty({ description: 'Trạng thái công khai của danh sách', example: false })
  isPublic: boolean;

  @ApiProperty({ description: 'Thông tin người dùng sở hữu', type: UserDto })
  user: UserDto;

  @ApiProperty({ description: 'Danh sách các mục yêu thích', type: [WishlistItemResponseDto] })
  items: WishlistItemResponseDto[];

  @ApiProperty({ description: 'Ngày tạo', example: '2023-04-01T10:30:40.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Ngày cập nhật', example: '2023-04-02T15:45:22.000Z' })
  updatedAt?: Date;
} 