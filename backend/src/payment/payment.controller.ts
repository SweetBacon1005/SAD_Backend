import { Roles } from '@/common/decorators/role.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
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
import { VnpayService } from './vnpay.service';
import { HandleVnpayReturnDto } from './dto/handle-vnpay-return.dto';
import { VnpayIpnDto } from './dto/vnpay-ipn.dto';
import { VnpayQueryDrDto } from './dto/vnpay-query-dr.dto';
import { VnpayRefundDto } from './dto/vnpay-refund.dto';

@ApiTags('payments')
@Controller('payments')
@ApiBearerAuth()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly vnpayService: VnpayService,
  ) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
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
  @ApiResponse({
    status: 200,
    description: 'Xử lý callback thành công',
    type: VnpayPaymentResponseDto,
  })
  handleVnpayReturn(@Query() query: HandleVnpayReturnDto): Promise<VnpayPaymentResponseDto> {
    return this.paymentService.handleVnpayReturn(query);
  }

  @Get(':id')
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

  @Post('vnpay-ipn')
  @ApiOperation({ summary: 'Xử lý IPN từ VNPay' })
  @ApiResponse({
    status: 200,
    description: 'Xử lý IPN thành công',
    type: VnpayPaymentResponseDto,
  })
  async handleVnpayIpn(@Body() body: VnpayIpnDto): Promise<VnpayPaymentResponseDto> {
    return this.paymentService.handleVnpayIpn(body);
  }

  @Post('vnpay-query-dr')
  @ApiOperation({ summary: 'Truy vấn giao dịch VNPay' })
  @ApiResponse({
    status: 200,
    description: 'Truy vấn giao dịch thành công',
    type: VnpayPaymentResponseDto,
  })
  async queryVnpayDr(@Body() queryDrDto: VnpayQueryDrDto): Promise<VnpayPaymentResponseDto> {
    return this.paymentService.queryVnpayDr(queryDrDto);
  }

  @Post('vnpay-refund')
  @ApiOperation({ summary: 'Hoàn tiền giao dịch VNPay' })
  @ApiResponse({
    status: 200,
    description: 'Yêu cầu hoàn tiền thành công',
    type: VnpayPaymentResponseDto,
  })
  async refundVnpay(@Body() refundDto: VnpayRefundDto): Promise<VnpayPaymentResponseDto> {
    return this.paymentService.refundVnpay(refundDto);
  }
}
