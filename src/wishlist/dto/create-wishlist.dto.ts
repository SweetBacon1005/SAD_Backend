import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWishlistDto {
  @ApiProperty({
    description: 'Tên danh sách yêu thích',
    example: 'Danh sách quần áo yêu thích',
  })
  @IsNotEmpty({ message: 'Tên danh sách yêu thích không được để trống' })
  @IsString({ message: 'Tên danh sách yêu thích phải là chuỗi' })
  name: string;

  @ApiPropertyOptional({
    description: 'Mô tả danh sách yêu thích',
    example: 'Những sản phẩm quần áo mà tôi yêu thích',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái công khai của danh sách',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái công khai phải là boolean' })
  isPublic?: boolean;
} 