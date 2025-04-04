import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'ID thanh toán',
    example: '6151f3d2e149e32b3404c8b5',
  })
  id: string;

  @ApiProperty({
    description: 'ID đơn hàng',
    example: '6151f3d2e149e32b3404c8b5',
  })
  orderId: string;

  @ApiProperty({
    description: 'Trạng thái thanh toán',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    example: PaymentMethod.VNPAY,
  })
  method: PaymentMethod;

  @ApiProperty({
    description: 'Số tiền thanh toán',
    example: 150000,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'Mã giao dịch từ cổng thanh toán',
    example: 'VNP13809778',
  })
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'URL thanh toán (cho thanh toán trực tuyến)',
    example: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=15000000&vnp_Command=pay&...',
  })
  paymentUrl?: string;

  @ApiProperty({
    description: 'Thời gian tạo thanh toán',
    example: '2023-04-01T10:30:40.000Z',
  })
  createdAt: Date;
} 