import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductComparisonRequestDto {
  @ApiProperty({
    description: 'Danh sách ID sản phẩm cần so sánh',
    example: ['6151f3d2e149e32b3404c8b5', '6151f3d2e149e32b3404c8b6'],
    type: [String],
  })
  @IsArray({ message: 'Danh sách ID sản phẩm phải là một mảng' })
  @IsString({ each: true, message: 'Mỗi ID sản phẩm phải là một chuỗi' })
  @IsNotEmpty({ each: true, message: 'ID sản phẩm không được để trống' })
  @ArrayMinSize(2, { message: 'Cần ít nhất 2 sản phẩm để so sánh' })
  productIds: string[];

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
} 