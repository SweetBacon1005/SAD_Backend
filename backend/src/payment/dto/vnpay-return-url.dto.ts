import { ApiProperty } from '@nestjs/swagger';

export class VnpayReturnUrlDto {
  @ApiProperty({
    description: 'Mã giao dịch VNPay',
    example: '12345678',
  })
  vnp_TransactionNo: string;

  @ApiProperty({
    description: 'Mã đơn hàng',
    example: 'ORDER_123456',
  })
  vnp_TxnRef: string;

  @ApiProperty({
    description: 'Số tiền thanh toán (VND)',
    example: 100000,
  })
  vnp_Amount: string;

  @ApiProperty({
    description: 'Mã ngân hàng',
    example: 'NCB',
  })
  vnp_BankCode: string;

  @ApiProperty({
    description: 'Mã giao dịch ngân hàng',
    example: '12345678',
  })
  vnp_BankTranNo: string;

  @ApiProperty({
    description: 'Loại thẻ',
    example: 'ATM',
  })
  vnp_CardType: string;

  @ApiProperty({
    description: 'Ngày thanh toán',
    example: '20240315123456',
  })
  vnp_PayDate: string;

  @ApiProperty({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toan don hang ORDER_123456',
  })
  vnp_OrderInfo: string;

  @ApiProperty({
    description: 'Mã phản hồi',
    example: '00',
  })
  vnp_ResponseCode: string;

  @ApiProperty({
    description: 'Chữ ký',
    example: '1234567890abcdef',
  })
  vnp_SecureHash: string;

  @ApiProperty({
    description: 'Loại chữ ký',
    example: 'SHA512',
  })
  vnp_SecureHashType: string;
} 