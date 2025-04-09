import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class TestHashRequestDto {
  @ApiProperty({
    description: 'Dữ liệu cần tạo hash',
    example: {
      vnp_Amount: '15000000',
      vnp_Command: 'pay',
      vnp_CreateDate: '20240407071600',
      vnp_CurrCode: 'VND',
      vnp_IpAddr: '127.0.0.1',
      vnp_Locale: 'vn',
      vnp_OrderInfo: 'Thanh toan don hang #12345',
      vnp_OrderType: 'other',
      vnp_ReturnUrl: 'http://localhost:3000/payment/vnpay-return',
      vnp_TmnCode: 'YOUR_TMN_CODE',
      vnp_TxnRef: '6151f3d2e149e32b3404c8b5',
      vnp_Version: '2.1.0',
    },
  })
  @IsNotEmpty()
  @IsObject()
  data: Record<string, any>;
}

export class TestHashResponseDto {
  @ApiProperty({
    description: 'Chữ ký điện tử được tạo',
    example: '1234567890abcdef',
  })
  hash: string;

  @ApiProperty({
    description: 'Tham số đã được ký',
    example: {
      vnp_Amount: '15000000',
      vnp_Command: 'pay',
      vnp_CreateDate: '20240407071600',
      vnp_CurrCode: 'VND',
      vnp_IpAddr: '127.0.0.1',
      vnp_Locale: 'vn',
      vnp_OrderInfo: 'Thanh toan don hang #12345',
      vnp_OrderType: 'other',
      vnp_ReturnUrl: 'http://localhost:3000/payment/vnpay-return',
      vnp_SecureHash: '1234567890abcdef',
      vnp_TmnCode: 'YOUR_TMN_CODE',
      vnp_TxnRef: '6151f3d2e149e32b3404c8b5',
      vnp_Version: '2.1.0',
    },
  })
  params: Record<string, any>;

  @ApiProperty({
    description: 'URL thanh toán đã được tạo',
    example: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=15000000&vnp_Command=pay&...',
  })
  url: string;
} 