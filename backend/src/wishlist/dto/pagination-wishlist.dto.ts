import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { WishlistResponseDto } from './wishlist-response.dto';

export enum WishlistSortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class WishlistFilterDto {
  @ApiPropertyOptional({
    description: 'Trường để sắp xếp',
    enum: WishlistSortField,
    default: WishlistSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(WishlistSortField)
  sortBy?: WishlistSortField = WishlistSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Trang hiện tại',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  currentPage?: number;

  @ApiPropertyOptional({
    description: 'Số danh sách trên mỗi trang',
    example: 10,
    default: 10,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;
}

export class WishlistListResponseDto {
  @ApiProperty({
    description: 'Danh sách yêu thích',
    type: [WishlistResponseDto],
  })
  data: WishlistResponseDto[];

  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Tổng số trang',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Tổng số kết quả',
    example: 45,
  })
  total: number;

  @ApiProperty({
    description: 'Thời gian truy vấn (timestamp)',
    example: '2023-04-05T10:30:40.000Z',
  })
  timestamp: string;
}

export class WishlistItemFilterDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên sản phẩm',
    example: 'Áo thun',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Trang hiện tại',
    example: 1,
    default: 1,
    minimum: 1,
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
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;
}

export class WishlistDetailResponseDto extends WishlistResponseDto {
  @ApiProperty({
    description: 'Trang hiện tại của danh sách sản phẩm',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Tổng số trang của danh sách sản phẩm',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Tổng số sản phẩm',
    example: 45,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Thời gian truy vấn (timestamp)',
    example: '2023-04-05T10:30:40.000Z',
  })
  timestamp: string;
}
