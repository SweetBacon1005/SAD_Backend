import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class ProductVariantDto {
  @ApiProperty({ description: 'Giá bán', example: 150000 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Số lượng tồn kho', example: 50 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ 
    description: 'Thuộc tính bổ sung', 
    example: { color: 'Đỏ', size: 'M', material: 'Cotton' } 
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}

export class ProductVariantResponseDto {
  @ApiProperty({ description: 'ID biến thể', example: '6151f3d2e149e32b3404c8c7' })
  id: string;

  @ApiProperty({ description: 'ID sản phẩm', example: '6151f3d2e149e32b3404c8b5' })
  productId: string;

  @ApiProperty({ description: 'Giá bán', example: 150000 })
  price: number;

  @ApiProperty({ description: 'Số lượng tồn kho', example: 50 })
  quantity: number;

  @ApiProperty({ 
    description: 'Thuộc tính bổ sung', 
    example: { color: 'Đỏ', size: 'M', material: 'Cotton' } 
  })
  attributes: Record<string, any>;

  @ApiProperty({ description: 'Ngày tạo', example: '2023-04-01T10:30:40.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Ngày cập nhật', example: '2023-04-02T15:45:22.000Z' })
  updatedAt: Date | null;
} 