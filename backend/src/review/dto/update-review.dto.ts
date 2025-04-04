import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Đánh giá sao (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt({ message: 'Đánh giá sao phải là số nguyên' })
  @Min(1, { message: 'Đánh giá sao tối thiểu là 1' })
  @Max(5, { message: 'Đánh giá sao tối đa là 5' })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Tiêu đề đánh giá',
    example: 'Sản phẩm rất tốt',
  })
  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Nội dung đánh giá',
    example: 'Sản phẩm đúng như mô tả, chất lượng tốt, giao hàng nhanh',
  })
  @IsOptional()
  @IsString({ message: 'Nội dung đánh giá phải là chuỗi' })
  comment?: string;

  @ApiPropertyOptional({
    description: 'Danh sách hình ảnh kèm theo đánh giá',
    example: ['url1.jpg', 'url2.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Danh sách hình ảnh phải là mảng' })
  @IsString({ each: true, message: 'Mỗi phần tử trong mảng phải là chuỗi' })
  images?: string[];
} 