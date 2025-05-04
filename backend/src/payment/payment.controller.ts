import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/role.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { HandleVnpayReturnDto } from './dto/handle-vnpay-return.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { VnpayIpnDto } from './dto/vnpay-ipn.dto';
import { VnpayQueryDrDto } from './dto/vnpay-query-dr.dto';
import { VnpayRefundDto } from './dto/vnpay-refund.dto';
import { VnpayPaymentResponseDto } from './dto/vnpay-response.dto';
import { PaymentService } from './payment.service';
import { VnpayService } from './vnpay.service';

@ApiTags('payments')
@Controller('payments')
@ApiBearerAuth()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly vnpayService: VnpayService,
  ) {}

  // -----------------------------------------
  // API THANH TOÁN THÔNG THƯỜNG
  // -----------------------------------------

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Tạo thanh toán mới' })
  @ApiBody({
    type: CreatePaymentDto,
    description: 'Thông tin thanh toán cần tạo',
  })
  @ApiResponse({
    status: 201,
    description: 'Thanh toán đã được tạo',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc đơn hàng đã thanh toán',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy đơn hàng',
  })
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: Request,
  ): Promise<PaymentResponseDto> {
    const userId = req['user']?.id;
    return this.paymentService.create(createPaymentDto, userId);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Lấy thông tin thanh toán của đơn hàng' })
  @ApiParam({
    name: 'orderId',
    description: 'ID của đơn hàng',
    type: String,
    required: true,
    example: '615f3d2e149e32b3404c8b5',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin thanh toán',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thông tin thanh toán',
  })
  findByOrderId(
    @Param('orderId') orderId: string,
    @Req() req: any,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.findByOrderId(orderId);
  }



  // -----------------------------------------
  // API XỬ LÝ WEBHOOKS VNPAY
  // -----------------------------------------

  @Patch('vnpay-return')
  @Public()
  @ApiOperation({ summary: 'Xử lý callback từ VNPay' })
  @ApiResponse({
    status: 200,
    description: 'Xử lý callback thành công',
    type: VnpayPaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu callback không hợp lệ',
  })
  handleVnpayReturn(
    @Body() query: HandleVnpayReturnDto,
  ): Promise<VnpayPaymentResponseDto> {
    if (!query.vnp_TxnRef || !query.vnp_Amount) {
      throw new BadRequestException(
        'Thiếu thông tin cần thiết trong dữ liệu callback',
      );
    }
    return this.paymentService.handleVnpayReturn(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin thanh toán theo ID' })
  @ApiParam({
    name: 'id',
    description: 'ID của thanh toán',
    type: String,
    required: true,
    example: '615f3d2e149e32b3404c8c5',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin thanh toán',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thông tin thanh toán',
  })
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.findOne(id);
  }

  // @Post('vnpay-ipn')
  // @Public()
  // @ApiOperation({
  //   summary: 'Xử lý IPN (Instant Payment Notification) từ VNPay',
  // })
  // @ApiBody({
  //   type: VnpayIpnDto,
  //   description: 'Dữ liệu IPN từ VNPay',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Xử lý IPN thành công',
  //   type: VnpayPaymentResponseDto,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Dữ liệu IPN không hợp lệ',
  // })
  // async handleVnpayIpn(
  //   @Body() body: VnpayIpnDto,
  // ): Promise<VnpayPaymentResponseDto> {
  //   if (!body.vnp_TxnRef || !body.vnp_SecureHash) {
  //     throw new BadRequestException(
  //       'Thiếu thông tin cần thiết trong dữ liệu IPN',
  //     );
  //   }
  //   return this.paymentService.handleVnpayIpn(body);
  // } 

  // // -----------------------------------------
  // // API QUẢN LÝ THANH TOÁN (ADMIN/MANAGER)
  // // -----------------------------------------

  // @Post('vnpay-query-dr')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  // @ApiOperation({ summary: 'Truy vấn kết quả giao dịch VNPay' })
  // @ApiBody({
  //   type: VnpayQueryDrDto,
  //   description: 'Thông tin truy vấn giao dịch',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Truy vấn giao dịch thành công',
  //   type: VnpayPaymentResponseDto,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Dữ liệu truy vấn không hợp lệ',
  // })
  // async queryVnpayDr(
  //   @Body() queryDrDto: VnpayQueryDrDto,
  // ): Promise<VnpayPaymentResponseDto> {
  //   if (!queryDrDto.orderId) {
  //     throw new BadRequestException('Thiếu mã đơn hàng cần truy vấn');
  //   }
  //   return this.paymentService.queryVnpayDr(queryDrDto);
  // }

  // @Post('vnpay-refund')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  // @ApiOperation({ summary: 'Hoàn tiền giao dịch VNPay' })
  // @ApiBody({
  //   type: VnpayRefundDto,
  //   description: 'Thông tin hoàn tiền',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Yêu cầu hoàn tiền thành công',
  //   type: VnpayPaymentResponseDto,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Dữ liệu hoàn tiền không hợp lệ',
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: 'Không tìm thấy đơn hàng',
  // })
  // async refundVnpay(
  //   @Body() refundDto: VnpayRefundDto,
  // ): Promise<VnpayPaymentResponseDto> {
  //   if (!refundDto.orderId || !refundDto.amount) {
  //     throw new BadRequestException(
  //       'Thiếu thông tin cần thiết cho yêu cầu hoàn tiền',
  //     );
  //   }
  //   return this.paymentService.refundVnpay(refundDto);
  // }
}
