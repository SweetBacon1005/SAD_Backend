import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignVoucherDto {
  @ApiProperty({
    description: 'ID của người dùng',
    example: '60d5ec9d2b5b82a5d5000002',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'ID của voucher',
    example: '60d5ec9d2b5b82a5d5000003',
  })
  @IsNotEmpty()
  @IsString()
  voucherId: string;

  @ApiProperty({
    description: 'Thời gian hết hạn (tùy chọn)',
    example: '2023-08-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
} 