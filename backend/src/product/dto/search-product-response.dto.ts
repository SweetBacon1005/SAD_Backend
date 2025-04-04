import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from './product-response.dto';

export class SearchProductResponseDto {
  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  currentPage: number;

  @ApiProperty({ description: 'Tổng số trang', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Tổng số sản phẩm tìm thấy', example: 47 })
  total: number;

  @ApiProperty({ 
    description: 'Danh sách sản phẩm tìm thấy',
    type: [ProductResponseDto]
  })
  data: ProductResponseDto[];
}