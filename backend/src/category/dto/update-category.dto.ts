import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Điện thoại thông minh',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Mô tả danh mục',
    example: 'Danh mục các loại điện thoại thông minh cao cấp',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'ID danh mục cha (nếu có)',
    example: '60d5ec9d2b5b82a5d5000001',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentId?: string;
} 