import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsNumber } from 'class-validator';

export class PaginationDto {
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
    description: 'Số mục trên mỗi trang',
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

export class PagedResponseDto<T> {
  @ApiProperty({
    description: 'Danh sách dữ liệu',
    isArray: true,
  })
  data: T[];

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
}
