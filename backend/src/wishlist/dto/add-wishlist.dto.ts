import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddWishlistItemDto {
  @ApiProperty({
    description: 'ID sản phẩm cần thêm vào danh sách yêu thích',
    example: '6151f3d2e149e32b3404c8b5',
  })
  @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
  @IsString({ message: 'ID sản phẩm phải là chuỗi' })
  productId: string;
}

// Tạo alias để tương thích với code mới
export class CreateWishlistItemDto extends AddWishlistItemDto {} 