import { Roles } from '@/common/decorators/role.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { VnpayPaymentResponseDto } from './dto/vnpay-response.dto';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('payments')
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo thanh toán mới' })
  @ApiResponse({
    status: 201,
    description: 'Thanh toán đã được tạo',
    type: PaymentResponseDto,
  })
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: Request,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.create(createPaymentDto);
  }

  @Get('vnpay-return')
  @ApiOperation({ summary: 'Xử lý callback từ VNPay' })
  @ApiQuery({
    name: 'vnp_Amount',
    required: true,
    description: 'Số tiền thanh toán',
  })
  @ApiQuery({
    name: 'vnp_BankCode',
    required: true,
    description: 'Mã ngân hàng',
  })
  @ApiQuery({
    name: 'vnp_OrderInfo',
    required: true,
    description: 'Thông tin đơn hàng',
  })
  @ApiQuery({
    name: 'vnp_ResponseCode',
    required: true,
    description: 'Mã phản hồi',
  })
  @ApiQuery({ name: 'vnp_TxnRef', required: true, description: 'Mã đơn hàng' })
  @ApiQuery({
    name: 'vnp_SecureHash',
    required: true,
    description: 'Chữ ký xác thực',
  })
  @ApiResponse({
    status: 200,
    description: 'Xử lý callback thành công',
    type: VnpayPaymentResponseDto,
  })
  handleVnpayReturn(@Query() query: any): Promise<VnpayPaymentResponseDto> {
    return this.paymentService.handleVnpayReturn(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin thanh toán' })
  @ApiParam({ name: 'id', description: 'ID của thanh toán' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin thanh toán',
    type: PaymentResponseDto,
  })
  findOne(@Param('id') id: string): Promise<PaymentResponseDto> {
    return this.paymentService.findOne(id);
  }

  @Get('order/:orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin thanh toán của đơn hàng' })
  @ApiParam({ name: 'orderId', description: 'ID của đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin thanh toán',
    type: PaymentResponseDto,
  })
  findByOrderId(
    @Param('orderId') orderId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.findByOrderId(orderId);
  }
}
