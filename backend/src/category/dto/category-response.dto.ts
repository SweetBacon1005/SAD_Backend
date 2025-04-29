import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: 'ID danh mục',
    example: '60d5ec9d2b5b82a5d5000003',
  })
  id: string;

  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Điện thoại',
  })
  name: string;

  @ApiProperty({
    description: 'Mô tả danh mục',
    example: 'Danh mục các loại điện thoại',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Hình ảnh danh mục',
    example: 'https://example.com/image.jpg',
    nullable: true, 
  })
  image: string | null;

  @ApiProperty({
    description: 'Số lượng sản phẩm trong danh mục',
    example: 15,
  })
  productCount: number;

  @ApiProperty({
    description: 'Thời gian tạo',
    example: '2021-06-25T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật gần nhất',
    example: '2021-06-26T15:30:00.000Z',
    nullable: true,
  })
  updatedAt: Date | null;
} 