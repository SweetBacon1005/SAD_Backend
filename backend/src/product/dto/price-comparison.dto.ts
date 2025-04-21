import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PriceComparisonRequestDto {
  @ApiProperty({
    description: 'Tên sản phẩm cần so sánh giá',
    example: 'iPhone 13 Pro Max 128GB',
  })
  @IsString({ message: 'Tên sản phẩm phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  productName: string;

  @ApiProperty({
    description: 'Danh mục sản phẩm để lọc kết quả chính xác hơn',
    example: 'Điện thoại',
    required: false,
  })
  @IsString({ message: 'Danh mục phải là chuỗi' })
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Chỉ hiển thị sản phẩm có sẵn trong kho',
    example: true,
    required: false,
    default: false,
  })
  @IsBoolean({ message: 'Trường inStock phải là boolean' })
  @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'Trang hiện tại',
    example: 1,
    default: 1,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  currentPage?: number;

  @ApiPropertyOptional({
    description: 'Số sản phẩm trên mỗi trang',
    example: 10,
    default: 10,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;
}

export class StoreProductPriceDto {
  @ApiProperty({
    description: 'ID cửa hàng',
    example: '6151f3d2e149e32b3404c8e0',
  })
  storeId: string;

  @ApiProperty({
    description: 'Tên cửa hàng',
    example: 'CellphoneS',
  })
  storeName: string;

  @ApiProperty({
    description: 'Địa chỉ cửa hàng',
    example: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
  })
  storeAddress: string;

  @ApiProperty({
    description: 'ID sản phẩm',
    example: '6151f3d2e149e32b3404c8b5',
  })
  productId: string;

  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'iPhone 13 Pro Max 128GB',
  })
  productName: string;

  @ApiProperty({
    description: 'Giá sản phẩm',
    example: 27990000,
  })
  price: number;

  @ApiProperty({
    description: 'URL hình ảnh sản phẩm',
    example: 'https://example.com/images/iphone-13-pro-max.jpg',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'URL sản phẩm',
    example: '/products/iphone-13-pro-max-128gb',
  })
  productUrl: string;

  @ApiProperty({
    description: 'Thông tin danh mục',
    example: {
      id: '6151f3d2e149e32b3404c8b7',
      name: 'Điện thoại',
    },
    required: false,
  })
  category?: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Trạng thái tồn kho',
    example: true,
  })
  inStock: boolean;

  @ApiProperty({
    description: 'Thông tin khuyến mãi (nếu có)',
    example: 'Giảm 2 triệu, tặng tai nghe AirPods',
    required: false,
  })
  promotion?: string;

  @ApiProperty({
    description: 'Danh sách biến thể sản phẩm',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '6151f3d2e149e32b3404c8b6' },
        name: { type: 'string', example: 'iPhone 13 Pro Max 128GB Xanh' },
        price: { type: 'number', example: 27990000 },
        quantity: { type: 'number', example: 10 },
        description: { type: 'string', example: 'Mô tả biến thể sản phẩm' },
        attributes: { 
          type: 'object',
          example: { color: 'Xanh', storage: '128GB' },
          additionalProperties: true 
        },
        images: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['https://example.com/images/iphone-13-pro-max-blue.jpg']
        }
      }
    }
  })
  variants: any[];
}

export class PriceComparisonResponseDto {
  @ApiProperty({
    description: 'Tên sản phẩm đã tìm kiếm',
    example: 'iPhone 13 Pro Max 128GB',
  })
  searchTerm: string;

  @ApiProperty({
    description: 'Danh sách sản phẩm từ các cửa hàng khác nhau',
    type: [StoreProductPriceDto],
  })
  results: StoreProductPriceDto[];

  @ApiProperty({
    description: 'Thông tin giá thấp nhất',
    example: {
      price: 27490000,
      storeId: '6151f3d2e149e32b3404c8e0',
      storeName: 'CellphoneS',
    },
  })
  lowestPrice: {
    price: number;
    storeId: string;
    storeName: string;
  };

  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Tổng số trang',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Tổng số kết quả',
    example: 45,
  })
  total: number;

  @ApiProperty({
    description: 'Thời gian so sánh (timestamp)',
    example: '2023-04-05T10:30:40.000Z',
  })
  timestamp: string;
}
