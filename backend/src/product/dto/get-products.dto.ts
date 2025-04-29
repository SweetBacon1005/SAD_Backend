import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductsDto {
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
