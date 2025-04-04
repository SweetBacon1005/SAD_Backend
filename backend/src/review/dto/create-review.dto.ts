import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID sản phẩm cần đánh giá',
    example: '6151f3d2e149e32b3404c8b5',
  })
  @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
  @IsString({ message: 'ID sản phẩm phải là chuỗi' })
  productId: string;

  @ApiProperty({
    description: 'Đánh giá sao (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNotEmpty({ message: 'Đánh giá sao không được để trống' })
  @IsInt({ message: 'Đánh giá sao phải là số nguyên' })
  @Min(1, { message: 'Đánh giá sao tối thiểu là 1' })
  @Max(5, { message: 'Đánh giá sao tối đa là 5' })
  rating: number;

  @ApiProperty({
    description: 'Tiêu đề đánh giá',
    example: 'Sản phẩm rất tốt',
  })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  title: string;

  @ApiProperty({
    description: 'Nội dung đánh giá',
    example: 'Sản phẩm đúng như mô tả, chất lượng tốt, giao hàng nhanh',
  })
  @IsNotEmpty({ message: 'Nội dung đánh giá không được để trống' })
  @IsString({ message: 'Nội dung đánh giá phải là chuỗi' })
  comment: string;

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