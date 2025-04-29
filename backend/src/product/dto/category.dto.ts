import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ description: 'ID danh mục', example: '6151f3d2e149e32b3404c8d1' })
  id: string;

  @ApiProperty({ description: 'Tên danh mục', example: 'Áo Thun' })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả danh mục', example: 'Các loại áo thun thời trang' })
  description: string | null;

  @ApiPropertyOptional({ description: 'ID danh mục cha', example: '6151f3d2e149e32b3404c8d0' })
  parentId: string | null;

  @ApiProperty({ description: 'Danh sách ID sản phẩm thuộc danh mục', type: [String], example: ['6151f3d2e149e32b3404c8b5'] })
  productIds: string[];

  @ApiProperty({ description: 'Ngày tạo danh mục', example: '2023-04-01T10:30:40.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Ngày cập nhật danh mục', example: '2023-04-02T15:45:22.000Z' })
  updatedAt: Date | null;
} 