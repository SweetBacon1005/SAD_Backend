import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VnpayReturnDto {
  @ApiProperty({
    description: 'Số tiền thanh toán',
    example: '15000000',
  })
  @IsNotEmpty()
  @IsString()
  vnp_Amount: string;

  @ApiProperty({
    description: 'Mã ngân hàng',
    example: 'NCB',
  })
  @IsNotEmpty()
  @IsString()
  vnp_BankCode: string;

  @ApiProperty({
    description: 'Mã giao dịch tại ngân hàng',
    example: 'VNP13809778',
  })
  @IsNotEmpty()
  @IsString()
  vnp_BankTranNo: string;

  @ApiProperty({
    description: 'Loại thẻ thanh toán',
    example: 'ATM',
  })
  @IsNotEmpty()
  @IsString()
  vnp_CardType: string;

  @ApiProperty({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toan don hang #12345',
  })
  @IsNotEmpty()
  @IsString()
  vnp_OrderInfo: string;

  @ApiProperty({
    description: 'Thời gian thanh toán',
    example: '20240407071600',
  })
  @IsNotEmpty()
  @IsString()
  vnp_PayDate: string;

  @ApiProperty({
    description: 'Mã phản hồi',
    example: '00',
  })
  @IsNotEmpty()
  @IsString()
  vnp_ResponseCode: string;

  @ApiProperty({
    description: 'Mã giao dịch tại VNPay',
    example: '13809778',
  })
  @IsNotEmpty()
  @IsString()
  vnp_TransactionNo: string;

  @ApiProperty({
    description: 'Mã đơn hàng',
    example: '6151f3d2e149e32b3404c8b5',
  })
  @IsNotEmpty()
  @IsString()
  vnp_TxnRef: string;

  @ApiProperty({
    description: 'Chữ ký điện tử',
    example: '1234567890abcdef',
  })
  @IsNotEmpty()
  @IsString()
  vnp_SecureHash: string;
} 