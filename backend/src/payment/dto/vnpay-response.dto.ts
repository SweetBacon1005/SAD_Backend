import { ApiProperty } from '@nestjs/swagger';

export class VnpayPaymentResponseDto {
  @ApiProperty({
    description: 'Trạng thái giao dịch',
    example: true,
  })
  isSuccess: boolean;

  @ApiProperty({
    description: 'Chữ ký có hợp lệ hay không',
    example: true,
  })
  isValidSignature: boolean;

  @ApiProperty({
    description: 'Số tiền giao dịch (VND)',
    example: 100000,
  })
  amount: number;

  @ApiProperty({
    description: 'Mã đơn hàng',
    example: 'ORDER_123456',
  })
  orderId: string;

  @ApiProperty({
    description: 'Mã giao dịch tại VNPay',
    example: '13136868',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Mã ngân hàng',
    example: 'NCB',
  })
  bankCode: string;

  @ApiProperty({
    description: 'Mã giao dịch tại ngân hàng',
    example: '20240315123456',
  })
  bankTranNo: string;

  @ApiProperty({
    description: 'Loại thẻ',
    example: 'ATM',
  })
  cardType: string;

  @ApiProperty({
    description: 'Thời gian thanh toán (yyyyMMddHHmmss)',
    example: '20240315123456',
  })
  payDate: string;

  @ApiProperty({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toan don hang ORDER_123456',
  })
  orderInfo: string;

  @ApiProperty({
    description: 'Mã phản hồi',
    example: '00',
  })
  responseCode: string;

  @ApiProperty({
    description: 'Thông điệp phản hồi',
    example: 'Giao dịch thành công',
  })
  message: string;

  @ApiProperty({
    description: 'Mã giao dịch gốc',
    example: '13136868',
  })
  vnp_TransactionNo?: string;

  @ApiProperty({
    description: 'Loại giao dịch',
    example: '02',
  })
  vnp_TransactionType?: string;

  @ApiProperty({
    description: 'Mã lỗi chi tiết',
    example: '00',
  })
  vnp_ResponseCode?: string;

  @ApiProperty({
    description: 'Mã giao dịch tại merchant',
    example: 'ORDER_123456',
  })
  vnp_TxnRef?: string;

  @ApiProperty({
    description: 'Mã merchant',
    example: 'MERCHANT123',
  })
  vnp_TmnCode?: string;

  @ApiProperty({
    description: 'Số tiền giao dịch (VND)',
    example: 10000000,
  })
  vnp_Amount?: number;

  @ApiProperty({
    description: 'Thời gian tạo giao dịch (yyyyMMddHHmmss)',
    example: '20240315123456',
  })
  vnp_CreateDate?: string;

  @ApiProperty({
    description: 'Thời gian giao dịch (yyyyMMddHHmmss)',
    example: '20240315123456',
  })
  vnp_TransactionDate?: string;

  @ApiProperty({
    description: 'Mã đơn vị tiền tệ',
    example: 'VND',
  })
  vnp_Currency?: string;

  @ApiProperty({
    description: 'Địa chỉ IP của người dùng',
    example: '127.0.0.1',
  })
  vnp_IpAddr?: string;

  @ApiProperty({
    description: 'Thông tin bổ sung',
    example: 'Additional info',
  })
  vnp_AdditionalData?: string;

  @ApiProperty({
    description: 'Mã giao dịch tại ngân hàng',
    example: '20240315123456',
  })
  vnp_BankTranNo?: string;

  @ApiProperty({
    description: 'Mã ngân hàng',
    example: 'NCB',
  })
  vnp_BankCode?: string;

  @ApiProperty({
    description: 'Thông tin thẻ',
    example: 'ATM',
  })
  vnp_CardType?: string;

  @ApiProperty({
    description: 'Mã lỗi chi tiết',
    example: '00',
  })
  vnp_ErrorCode?: string;

  @ApiProperty({
    description: 'Thông điệp lỗi',
    example: 'Giao dịch thành công',
  })
  vnp_ErrorMessage?: string;
} 