import { ApiProperty } from '@nestjs/swagger';
import { VoucherResponseDto } from './voucher-response.dto';

export class UserVoucherResponseDto {
  @ApiProperty({
    description: 'ID của user voucher',
    example: '60d5ec9d2b5b82a5d5000001',
  })
  id: string;

  @ApiProperty({
    description: 'ID của người dùng',
    example: '60d5ec9d2b5b82a5d5000002',
  })
  userId: string;

  @ApiProperty({
    description: 'ID của voucher',
    example: '60d5ec9d2b5b82a5d5000003',
  })
  voucherId: string;

  @ApiProperty({
    description: 'Thông tin chi tiết của voucher',
    type: VoucherResponseDto,
  })
  voucher: VoucherResponseDto;

  @ApiProperty({
    description: 'Trạng thái đã sử dụng',
    example: false,
  })
  isUsed: boolean;

  @ApiProperty({
    description: 'Thời gian sử dụng',
    example: '2023-07-15T10:30:00Z',
    nullable: true,
  })
  usedAt: Date | null;

  @ApiProperty({
    description: 'Thời gian hết hạn',
    example: '2023-08-31T23:59:59Z',
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: 'Thời gian nhận voucher',
    example: '2023-06-01T10:00:00Z',
  })
  obtainedAt: Date;
} 