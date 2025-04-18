import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Điện thoại',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Mô tả danh mục',
    example: 'Danh mục các loại điện thoại',
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