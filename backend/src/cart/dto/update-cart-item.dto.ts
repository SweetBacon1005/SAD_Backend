import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

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
} 