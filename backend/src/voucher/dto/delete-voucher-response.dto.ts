import { ApiProperty } from '@nestjs/swagger';

export class DeleteVoucherResponseDto {
  @ApiProperty({
    description: 'Trạng thái thành công',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Thông báo kết quả',
    example: 'Voucher with ID abc123 has been successfully deleted',
  })
  message: string;
} 