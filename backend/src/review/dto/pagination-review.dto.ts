import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewResponseDto } from './review-response.dto';

export enum ReviewSortField {
  CREATED_AT = 'createdAt',
  RATING = 'rating',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ReviewFilterDto {
  @ApiPropertyOptional({
    description: 'ID sản phẩm để lọc đánh giá',
    example: '6151f3d2e149e32b3404c8b5',
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Trường để sắp xếp',
    enum: ReviewSortField,
    default: ReviewSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ReviewSortField)
  sortBy?: ReviewSortField = ReviewSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Lọc theo đánh giá sao (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  rating?: number;

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
    description: 'Số đánh giá trên mỗi trang',
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

export class ReviewRatingStatDto {
  @ApiProperty({
    description: 'Đánh giá sao trung bình',
    example: 4.5,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Thống kê số lượng đánh giá theo số sao',
    example: {
      1: 2,
      2: 5,
      3: 10,
      4: 20,
      5: 30,
    },
  })
  ratingStats: Record<number, number>;
}

export class ReviewListResponseDto {
  @ApiProperty({
    description: 'Danh sách đánh giá',
    type: [ReviewResponseDto],
  })
  data: ReviewResponseDto[];

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
    description: 'Đánh giá sao trung bình',
    example: 4.5,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Thống kê số lượng đánh giá theo số sao',
    example: {
      1: 2,
      2: 5,
      3: 10,
      4: 20,
      5: 30,
    },
  })
  ratingStats: Record<number, number>;
} 