// cart.dto.ts
import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CartItemAttributesDto {
  [key: string]: any;
}

export class AddCartItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsObject()
  attributes?: CartItemAttributesDto;
}

export class UpdateCartItemDto {
  @IsString()
  cartItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsObject()
  attributes?: CartItemAttributesDto;
}

export class UpdateCartDto {
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
