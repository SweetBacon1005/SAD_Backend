import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProductDto {
  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  currentPage: number;

  @ApiProperty({
    description: 'Số sản phẩm trên mỗi trang',
    example: 10,
    minimum: 1,
    default: 10
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  pageSize: number;

  @ApiProperty({
    description: 'Từ khóa tìm kiếm',
    example: 'áo thun'
  })
  @IsString()
  @IsNotEmpty()
  query: string;
}
