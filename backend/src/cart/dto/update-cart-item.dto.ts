import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { CartItemAttributesDto } from './cart-attributes.dto';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'ID của item trong giỏ hàng cần cập nhật',
    example: '6151f3d2e149e32b3404c8e1',
  })
  @IsString()
  cartItemId: string;

  @ApiProperty({
    description: 'Số lượng sản phẩm mới',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'ID của biến thể sản phẩm mới (nếu muốn đổi biến thể)',
    example: '6151f3d2e149e32b3404c8c8',
  })
  @IsOptional()
  @IsString()
  variantId?: string;
} 