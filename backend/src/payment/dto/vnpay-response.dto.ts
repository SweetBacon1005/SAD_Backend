import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VnpayPaymentResponseDto {
  @ApiProperty({
    description: 'Trạng thái giao dịch có thành công hay không',
    example: true,
  })
  isSuccess: boolean;

  @ApiProperty({
    description: 'Chữ ký có hợp lệ hay không',
    example: true,
  })
  isValidSignature: boolean;

  @ApiProperty({
    description: 'Số tiền thanh toán',
    example: 150000,
  })
  amount: number;

  @ApiProperty({
    description: 'Mã đơn hàng',
    example: '6151f3d2e149e32b3404c8b5',
  })
  orderId: string;

  @ApiProperty({
    description: 'Mã giao dịch VNPay',
    example: '13809778',
  })
  transactionId: string;

  @ApiPropertyOptional({
    description: 'Mã ngân hàng',
    example: 'NCB',
  })
  bankCode?: string;

  @ApiPropertyOptional({
    description: 'Mã giao dịch tại ngân hàng',
    example: 'VNP13809778',
  })
  bankTranNo?: string;

  @ApiPropertyOptional({
    description: 'Loại thẻ thanh toán',
    example: 'ATM',
  })
  cardType?: string;

  @ApiPropertyOptional({
    description: 'Thời gian thanh toán',
    example: '20230401103040',
  })
  payDate?: string;

  @ApiPropertyOptional({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toán đơn hàng #12345',
  })
  orderInfo?: string;

  @ApiProperty({
    description: 'Mã phản hồi từ VNPay',
    example: '00',
  })
  responseCode: string;

  @ApiProperty({
    description: 'Thông điệp kết quả giao dịch',
    example: 'Giao dịch thành công',
  })
  message: string;
} 