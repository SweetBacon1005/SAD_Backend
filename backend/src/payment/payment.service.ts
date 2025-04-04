import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { VnpayService } from './vnpay.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { VnpayPaymentResponseDto } from './dto/vnpay-response.dto';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private vnpayService: VnpayService,
  ) {}

  /**
   * Tạo thanh toán mới
   */
  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    // Kiểm tra đơn hàng tồn tại
    const order = await this.prisma.order.findUnique({
      where: { id: createPaymentDto.orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Kiểm tra đơn hàng đã có thanh toán chưa
    if (order.payment) {
      // Nếu thanh toán đã tồn tại và thành công, không cho phép tạo mới
      if (order.payment.status === PaymentStatus.PAID) {
        throw new BadRequestException('Đơn hàng này đã được thanh toán thành công');
      }
    }

    // Xử lý tùy theo phương thức thanh toán
    let paymentData: any = {
      orderId: createPaymentDto.orderId,
      status: PaymentStatus.PENDING,
      method: createPaymentDto.method,
      amount: createPaymentDto.amount,
    };

    let paymentResponse: PaymentResponseDto;

    switch (createPaymentDto.method) {
      case PaymentMethod.VNPAY:
        // Tạo URL thanh toán VNPay
        const paymentUrl = await this.vnpayService.createPaymentUrl({
          orderId: createPaymentDto.orderId,
          amount: createPaymentDto.amount,
          ipAddr: createPaymentDto.ipAddr,
        });

        // Lưu thông tin thanh toán vào database
        const payment = await this.createOrUpdatePayment(paymentData);

        // Trả về response với URL thanh toán
        paymentResponse = {
          ...payment,
          paymentUrl,
        };
        break;

      case PaymentMethod.COD:
        // Đối với COD, chỉ cần tạo bản ghi thanh toán
        const codPayment = await this.createOrUpdatePayment(paymentData);
        paymentResponse = { ...codPayment };
        break;

      default:
        throw new BadRequestException('Phương thức thanh toán không được hỗ trợ');
    }

    return paymentResponse;
  }

  /**
   * Xử lý callback từ VNPay
   */
  async handleVnpayReturn(vnpParams: any): Promise<VnpayPaymentResponseDto> {
    // Xác minh thông tin thanh toán từ VNPay
    const vnpayResponse = this.vnpayService.verifyReturnUrl(vnpParams);
    
    if (!vnpayResponse.isValidSignature) {
      this.logger.error('Chữ ký VNPay không hợp lệ');
      throw new BadRequestException('Chữ ký không hợp lệ');
    }

    // Lấy thông tin đơn hàng từ orderId trả về
    const orderId = vnpayResponse.orderId;
    
    // Kiểm tra đơn hàng tồn tại
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      this.logger.error(`Đơn hàng không tồn tại: ${orderId}`);
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Cập nhật thanh toán
    let paymentStatus = PaymentStatus.PENDING;
    if (vnpayResponse.isSuccess) {
      paymentStatus = PaymentStatus.PAID;
      
      // Cập nhật trạng thái đơn hàng
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });
    } else {
      paymentStatus = PaymentStatus.FAILED;
    }

    // Cập nhật thông tin thanh toán
    await this.prisma.payment.update({
      where: { orderId },
      data: {
        status: paymentStatus,
        transactionId: vnpayResponse.transactionId,
      },
    });

    return vnpayResponse;
  }

  /**
   * Lấy thông tin thanh toán
   */
  async findOne(id: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Thanh toán không tồn tại');
    }

    return this.mapToPaymentResponseDto(payment);
  }

  /**
   * Lấy thông tin thanh toán của đơn hàng
   */
  async findByOrderId(orderId: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      throw new NotFoundException('Thanh toán không tồn tại');
    }

    return this.mapToPaymentResponseDto(payment);
  }

  /**
   * Helper method để tạo hoặc cập nhật thanh toán
   */
  private async createOrUpdatePayment(paymentData: any): Promise<PaymentResponseDto> {
    const { orderId } = paymentData;
    
    // Kiểm tra thanh toán đã tồn tại chưa
    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    let payment;

    if (existingPayment) {
      // Cập nhật thanh toán hiện có
      payment = await this.prisma.payment.update({
        where: { orderId },
        data: paymentData,
      });
    } else {
      // Tạo thanh toán mới
      payment = await this.prisma.payment.create({
        data: paymentData,
      });

      // Cập nhật thông tin thanh toán trong đơn hàng
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: paymentData.method,
          paymentStatus: paymentData.status,
        },
      });
    }

    return this.mapToPaymentResponseDto(payment);
  }

  /**
   * Helper method để map từ Prisma model sang DTO
   */
  private mapToPaymentResponseDto(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      transactionId: payment.transactionId || undefined,
      createdAt: payment.createdAt,
    };
  }
} 