import { ApiProperty } from '@nestjs/swagger';

class CategoryParentDto {
  @ApiProperty({
    description: 'ID danh mục cha',
    example: '60d5ec9d2b5b82a5d5000001',
  })
  id: string;

  @ApiProperty({
    description: 'Tên danh mục cha',
    example: 'Thiết bị điện tử',
  })
  name: string;

  @ApiProperty({
    description: 'Slug danh mục cha',
    example: 'thiet-bi-dien-tu',
  })
  slug: string;
}

class CategoryChildDto {
  @ApiProperty({
    description: 'ID danh mục con',
    example: '60d5ec9d2b5b82a5d5000002',
  })
  id: string;

  @ApiProperty({
    description: 'Tên danh mục con',
    example: 'Điện thoại Samsung',
  })
  name: string;

  @ApiProperty({
    description: 'Slug danh mục con',
    example: 'dien-thoai-samsung',
  })
  slug: string;
}

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
    description: 'Slug danh mục',
    example: 'dien-thoai',
  })
  slug: string;

  @ApiProperty({
    description: 'Mô tả danh mục',
    example: 'Danh mục các loại điện thoại',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'ID danh mục cha',
    example: '60d5ec9d2b5b82a5d5000001',
    nullable: true,
  })
  parentId: string | null;

  @ApiProperty({
    description: 'Thông tin danh mục cha',
    type: CategoryParentDto,
    nullable: true,
  })
  parent: CategoryParentDto | null;

  @ApiProperty({
    description: 'Danh sách danh mục con',
    type: [CategoryChildDto],
  })
  children: CategoryChildDto[];

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