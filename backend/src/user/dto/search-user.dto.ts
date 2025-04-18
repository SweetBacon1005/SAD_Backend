import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';

export class SearchUserDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  @Type(() => Number)
  currentPage?: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'Số người dùng mỗi trang', example: 10 })
  @Type(() => Number)
  pageSize?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm (tên, email)', example: 'john' })
  query?: string;

  @IsEnum(UserRole)
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'Lọc theo vai trò', 
    enum: UserRole, 
    example: UserRole.CUSTOMER 
  })
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'Lọc theo trạng thái hoạt động', 
    example: true 
  })
  @Type(() => Boolean)
  isActive?: boolean;
} 