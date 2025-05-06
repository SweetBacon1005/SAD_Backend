import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortField {
  PRICE = 'price',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class SearchProductDto {
  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
    minimum: 1,
    default: 1,
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
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;

  @ApiProperty({
    description: 'Từ khóa tìm kiếm',
    example: 'áo thun',
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({
    description: 'ID danh mục để lọc sản phẩm',
    example: '6151f3d2e149e32b3404c8b5',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Trường để sắp xếp',
    enum: SortField,
    default: SortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SortField)
  sortBy?: SortField = SortField.CREATED_AT;

  @ApiProperty({
    description: 'Thứ tự sắp xếp',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiProperty({
    description: 'Giá tối thiểu (VND)',
    example: 100000,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiProperty({
    description: 'Giá tối đa (VND)',
    example: 500000,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiProperty({
    description: 'Lọc sản phẩm có khuyến mãi',
    example: true,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Boolean)
  @IsOptional()
  haveDiscount?: boolean;
}
