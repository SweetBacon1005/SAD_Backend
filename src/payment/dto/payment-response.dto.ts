import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'ID của thanh toán',
    example: '6151f3d2e149e32b3404c8b5',
  })
  id: string;

  @ApiProperty({
    description: 'ID đơn hàng',
    example: '6151f3d2e149e32b3404c8b5',
  })
  orderId: string;

  @ApiProperty({
    description: 'Số tiền thanh toán (VND)',
    example: 150000,
  })
  amount: number;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    example: PaymentMethod.VNPAY,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Trạng thái thanh toán',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Thông tin đơn hàng',
    example: 'Thanh toán đơn hàng #12345',
  })
  orderInfo: string;

  @ApiProperty({
    description: 'Mã giao dịch từ cổng thanh toán',
    example: 'VNP13809778',
    required: false,
  })
  transactionId?: string;

  @ApiProperty({
    description: 'URL thanh toán (cho thanh toán trực tuyến)',
    example: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=15000000&vnp_Command=pay&...',
    required: false,
  })
  paymentUrl?: string;

  @ApiProperty({
    description: 'Thời gian tạo',
    example: '2024-04-07T07:16:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật',
    example: '2024-04-07T07:16:00.000Z',
  })
  updatedAt: Date;
} 