import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VnpayIpnDto {
  @ApiProperty({
    description: 'Số tiền thanh toán (VND x100)',
    example: '15000000',
  })
  @IsNotEmpty()
  @IsString()
  vnp_Amount: string;

  @ApiProperty({ description: 'Mã ngân hàng thanh toán', example: 'NCB' })
  @IsOptional()
  @IsString()
  vnp_BankCode: string;

  @ApiProperty({
    description: 'Mã giao dịch tại ngân hàng',
    example: 'VNP14894890',
  })
  @IsOptional()
  @IsString()
  vnp_BankTranNo: string;

  @ApiProperty({
    description: 'Loại thẻ thanh toán (ATM, VISA, etc.)',
    example: 'ATM',
  })
  @IsOptional()
  @IsString()
  vnp_CardType: string;

  @ApiProperty({
    description: 'Mã đơn hàng (tham chiếu)',
    example: '67f38d018f136ce256ed588f',
  })
  @IsNotEmpty()
  @IsString()
  vnp_TxnRef: string;

  @ApiProperty({
    description: 'Thông tin đơn hàng hiển thị cho user',
    example: 'Thanh toan don hang :67f38d018f136ce256ed588f',
  })
  @IsOptional()
  @IsString()
  vnp_OrderInfo: string;

  @ApiProperty({
    description: 'Thời gian thanh toán (yyyyMMddHHmmss)',
    example: '20250408122810',
  })
  @IsOptional()
  @IsString()
  vnp_PayDate: string;

  @ApiProperty({
    description: 'Mã website TMN của merchant',
    example: 'OAPSROZO',
  })
  @IsOptional()
  @IsString()
  vnp_TmnCode: string;

  @ApiProperty({
    description: 'Mã phản hồi kết quả thanh toán (00 là thành công)',
    example: '00',
  })
  @IsOptional()
  @IsString()
  vnp_ResponseCode: string;

  @ApiProperty({
    description: 'Trạng thái giao dịch (00 là thành công)',
    example: '00',
  })
  @IsOptional()
  @IsString()
  vnp_TransactionStatus: string;

  @ApiProperty({
    description: 'Mã giao dịch tại hệ thống VNPay',
    example: '14894890',
  })
  @IsOptional()
  @IsString()
  vnp_TransactionNo: string;

  @ApiProperty({
    description: 'Mã kiểm tra bảo mật (hash từ VNPay)',
    example: 'abc123...',
  })
  @IsNotEmpty()
  @IsString()
  vnp_SecureHash: string;

  @ApiProperty({
    description: 'Loại chữ ký',
    example: 'SHA512',
  })
  @IsOptional()
  @IsString()
  vnp_SecureHashType: string;
} 