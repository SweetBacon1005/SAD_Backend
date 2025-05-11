import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateReviewDto {

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