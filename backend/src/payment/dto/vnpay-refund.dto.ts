import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class VnpayRefundDto {
  @ApiProperty({
    description: 'Mã đơn hàng cần hoàn tiền',
    example: 'ORDER_123456',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Số tiền cần hoàn',
    example: 100000,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Ngày giao dịch gốc (yyyyMMddHHmmss)',
    example: '20240315123456',
  })
  @IsNotEmpty()
  @IsString()
  transDate: string;

  @ApiProperty({
    description: 'Loại giao dịch',
    example: '02',
  })
  @IsNotEmpty()
  @IsString()
  transType: string;

  @ApiProperty({
    description: 'Người tạo yêu cầu hoàn tiền',
    example: 'admin',
  })
  @IsNotEmpty()
  @IsString()
  user: string;

  @ApiProperty({
    description: 'Địa chỉ IP của người dùng',
    example: '127.0.0.1',
  })
  @IsNotEmpty()
  @IsString()
  ipAddr: string;

  @ApiProperty({
    description: 'Lý do hoàn tiền',
    example: 'Khách hàng yêu cầu hủy đơn hàng',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;
} 