import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VnpayQueryDrDto {
  @ApiProperty({
    description: 'Mã đơn hàng cần truy vấn',
    example: '67f38d018f136ce256ed588f',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Thời gian tạo giao dịch (yyyyMMddHHmmss)',
    example: '20250408122810',
  })
  @IsNotEmpty()
  @IsString()
  createDate: string;

  @ApiProperty({
    description: 'Địa chỉ IP của người dùng',
    example: '127.0.0.1',
  })
  @IsNotEmpty()
  @IsString()
  ipAddr: string;
} 