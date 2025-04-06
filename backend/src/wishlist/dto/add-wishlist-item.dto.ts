import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddWishlistItemDto {
  @ApiProperty({
    description: 'ID danh sách yêu thích',
    example: '6151f3d2e149e32b3404c8b4',
  })
  @IsNotEmpty({ message: 'ID danh sách yêu thích không được để trống' })
  @IsString({ message: 'ID danh sách yêu thích phải là chuỗi' })
  wishlistId: string;

  @ApiProperty({
    description: 'ID sản phẩm cần thêm vào danh sách yêu thích',
    example: '6151f3d2e149e32b3404c8b5',
  })
  @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
  @IsString({ message: 'ID sản phẩm phải là chuỗi' })
  productId: string;

  @ApiPropertyOptional({
    description: 'Ghi chú cho sản phẩm',
    example: 'Màu đen, size M',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  note?: string;
} 