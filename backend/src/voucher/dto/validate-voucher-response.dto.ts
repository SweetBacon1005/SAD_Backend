import { ApiProperty } from '@nestjs/swagger';
import { VoucherResponseDto } from './voucher-response.dto';

export class ValidateVoucherResponseDto {
  @ApiProperty({
    description: 'Trạng thái hợp lệ của voucher',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Thông báo kết quả kiểm tra',
    example: 'Voucher hợp lệ',
  })
  message: string;

  @ApiProperty({
    description: 'Thông tin voucher nếu hợp lệ',
    type: VoucherResponseDto,
    nullable: true,
  })
  voucher: VoucherResponseDto | null;

  @ApiProperty({
    description: 'Số tiền giảm giá nếu voucher hợp lệ',
    example: 50000,
    nullable: true,
  })
  discountAmount?: number;
} 