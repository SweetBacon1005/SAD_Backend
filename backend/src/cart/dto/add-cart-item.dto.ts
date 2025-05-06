import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'ID của sản phẩm cần thêm vào giỏ hàng',
    example: '6151f3d2e149e32b3404c8b5',
  })
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    description: 'ID của biến thể sản phẩm (nếu có)',
    example: '6151f3d2e149e32b3404c8c7',
  })
  @IsOptional()
  @IsString()
  variantId: string;

  @ApiProperty({
    description: 'Số lượng sản phẩm',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
} 