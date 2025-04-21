import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductsDto {
  @ApiPropertyOptional({
    description: 'Trang hiện tại',
    example: 1,
    default: 1,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  currentPage?: number;

  @ApiPropertyOptional({
    description: 'Số sản phẩm trên mỗi trang',
    example: 10,
    default: 10,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'ID danh mục cần lọc',
    example: '6151f3d2e149e32b3404c8d1'
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Giá tối thiểu (VND)',
    example: 100000,
    minimum: 0
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({
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
