import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ProductVariantDto } from './product-variant.dto';

export class CreateProductDto {
  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Áo Thun Oversize Form Rộng'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Slug sản phẩm (URL-friendly)',
    example: 'ao-thun-oversize-form-rong'
  })
  @IsString()
  slug: string;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết sản phẩm',
    example: 'Áo thun oversize phong cách Hàn Quốc, chất liệu cotton 100%, thoáng mát'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Giá bán cơ bản của sản phẩm (VND)',
    example: 150000
  })
  @IsNumber()
  basePrice: number;

  @ApiProperty({
    description: 'ID danh mục sản phẩm',
    example: '6151f3d2e149e32b3404c8d1'
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'ID cửa hàng bán sản phẩm',
    example: '6151f3d2e149e32b3404c8e0'
  })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiProperty({
    description: 'Danh sách đường dẫn hình ảnh sản phẩm',
    type: [String],
    example: ['https://example.com/images/product-1.jpg', 'https://example.com/images/product-2.jpg']
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiPropertyOptional({
    description: 'Thông tin bổ sung về sản phẩm',
    example: {
      colors: ['Đỏ', 'Đen', 'Trắng'],
      sizes: ['S', 'M', 'L', 'XL'],
      material: 'Cotton 100%',
      origin: 'Việt Nam'
    }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Danh sách các biến thể của sản phẩm',
    type: [ProductVariantDto]
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Tên sản phẩm cần cập nhật',
    example: 'Áo Thun Oversize Form Rộng Premium'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Slug sản phẩm cần cập nhật',
    example: 'ao-thun-oversize-form-rong-premium'
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Mô tả cần cập nhật',
    example: 'Áo thun oversize phong cách Hàn Quốc, chất liệu cotton cao cấp'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Giá bán cơ bản cần cập nhật',
    example: 180000
  })
  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional({
    description: 'ID danh mục cần cập nhật',
    example: '6151f3d2e149e32b3404c8d1'
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'ID cửa hàng cần cập nhật',
    example: '6151f3d2e149e32b3404c8e1'
  })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional({
    description: 'Danh sách hình ảnh cần cập nhật',
    type: [String],
    example: ['https://example.com/images/product-new-1.jpg', 'https://example.com/images/product-new-2.jpg']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Thông tin bổ sung cần cập nhật',
    example: {
      colors: ['Đỏ', 'Đen', 'Trắng', 'Xanh'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      material: 'Cotton 100%',
      origin: 'Việt Nam',
      note: 'Sản phẩm cao cấp'
    }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Danh sách biến thể cần cập nhật',
    type: [ProductVariantDto]
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}