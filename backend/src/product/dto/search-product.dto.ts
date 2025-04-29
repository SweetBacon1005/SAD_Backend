import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProductDto {
  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  currentPage?: number;

  @ApiProperty({
    description: 'Số sản phẩm trên mỗi trang',
    example: 10,
    minimum: 1,
    default: 10
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;

  @ApiProperty({
    description: 'Từ khóa tìm kiếm',
    example: 'áo thun'
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({
    description: 'ID danh mục để lọc sản phẩm',
    example: '6151f3d2e149e32b3404c8b5'
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Sắp xếp',
    example: 'Price:asc',
    enum: ['Price:asc', 'Price:desc', 'CreatedAt:asc', 'CreatedAt:desc'],
  })
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiProperty({
    description: 'Giá tối thiểu (VND)',
    example: 100000,
    minimum: 0
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiProperty({
    description: 'Giá tối đa (VND)',
    example: 500000,
    minimum: 0
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;
}
