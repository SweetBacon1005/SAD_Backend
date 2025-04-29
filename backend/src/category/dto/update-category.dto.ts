import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Điện thoại',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Mô tả danh mục',
    example: 'Danh mục các loại điện thoại',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Hình ảnh danh mục',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  image?: string;
} 