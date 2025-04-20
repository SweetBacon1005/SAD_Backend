import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethod,
  PaymentStatus,
  TransactionStatus,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { HandleVnpayReturnDto } from './dto/handle-vnpay-return.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { CreatePaymentTransactionDto } from './dto/payment-transaction.dto';
import { VnpayIpnDto } from './dto/vnpay-ipn.dto';
import { VnpayQueryDrDto } from './dto/vnpay-query-dr.dto';
import { VnpayRefundDto } from './dto/vnpay-refund.dto';
import { VnpayPaymentResponseDto } from './dto/vnpay-response.dto';
import { VnpayService } from './vnpay.service';
import { PaymentDataDto } from './dto/payment-data.dto';
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private vnpayService: VnpayService,
  ) {}

  async create(
    payload: CreatePaymentDto,
    userId?: string,
  ): Promise<PaymentResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: payload.orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    if (userId && order.userId !== userId) {
      this.logger.error(`Người dùng ${userId} không có quyền thanh toán đơn hàng ${order.id}`);
      throw new BadRequestException('Bạn không có quyền thanh toán đơn hàng này');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Đơn hàng này đã được thanh toán thành công');
    }

    const paymentAmount = order.total;
    
    if (paymentAmount <= 0) {
      throw new BadRequestException('Số tiền thanh toán không hợp lệ');
    }

    const paymentData = {
      orderId: order.id,
      status: PaymentStatus.PENDING,
      paymentMethod: payload.paymentMethod,
      amount: paymentAmount,
      orderInfo: payload.orderInfo || `Thanh toán đơn hàng #${order.id}`,
    };

    let payment = await this.createOrUpdatePayment(paymentData);
    let paymentResponse: PaymentResponseDto = this.mapToPaymentResponseDto(payment);

    if (payload.paymentMethod === PaymentMethod.VNPAY) {
      const paymentUrl = await this.vnpayService.createPaymentUrl({
        orderId: order.id,
        amount: paymentAmount,
        orderInfo: paymentData.orderInfo,
      });

      const transactionData: CreatePaymentTransactionDto = {
        paymentId: payment.id,
        transactionId: `VNPAY_${Date.now()}`,
        status: TransactionStatus.PENDING,
        amount: paymentAmount,
        paymentMethod: PaymentMethod.VNPAY,
        provider: 'VNPAY',
        providerData: {
          paymentUrl,
        },
      };

      await this.createTransaction(transactionData);
      paymentResponse.paymentUrl = paymentUrl;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: payload.paymentMethod,
      },
    });

    this.logger.log(`Tạo thanh toán mới cho đơn hàng ${order.id} với số tiền ${paymentAmount}`);
    return paymentResponse;
  }

  async handleVnpayReturn(
    vnpParams: HandleVnpayReturnDto,
  ): Promise<VnpayPaymentResponseDto> {
    vnpParams.vnp_OrderInfo = decodeURIComponent(
      vnpParams.vnp_OrderInfo.replace(/\+/g, ' '),
    );
    console.log('vnpParams', vnpParams);

    const vnpayResponse = this.vnpayService.verifyReturnUrl(vnpParams);

    if (!vnpayResponse.isValidSignature) {
      this.logger.error('Chữ ký VNPay không hợp lệ');
      throw new BadRequestException('Chữ ký không hợp lệ');
    }

    const orderId = vnpayResponse.orderId;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: {
          include: {
            transactions: true,
          },
        },
      },
    });

    if (!order) {
      this.logger.error(`Đơn hàng không tồn tại: ${orderId}`);
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
    let transactionStatus: TransactionStatus = TransactionStatus.PENDING;

    if (vnpayResponse.isSuccess) {
      paymentStatus = PaymentStatus.PAID;
      transactionStatus = TransactionStatus.SUCCESS;

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });
    } else {
      paymentStatus = PaymentStatus.FAILED;
      transactionStatus = TransactionStatus.FAILED;
    }

    const payment = await this.prisma.payment.update({
      where: { orderId },
      data: {
        status: paymentStatus,
      },
    });

    const transaction = order.payment?.transactions[0];
    if (transaction) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: transactionStatus,
          transactionId: vnpayResponse.transactionId,
          providerData: {
            bankCode: vnpayResponse.bankCode,
            bankTranNo: vnpayResponse.bankTranNo,
            cardType: vnpayResponse.cardType,
            payDate: vnpayResponse.payDate,
            responseCode: vnpayResponse.responseCode,
          },
          errorMessage:
            transactionStatus === TransactionStatus.FAILED
              ? vnpayResponse.message
              : null,
        },
      });
    }

    return vnpayResponse;
  }

  async handleVnpayIpn(
    vnpParams: VnpayIpnDto,
  ): Promise<VnpayPaymentResponseDto> {
    const vnpayResponse = await this.vnpayService.handleIpn(vnpParams);

    if (!vnpayResponse.isValidSignature) {
      this.logger.error('Chữ ký VNPay không hợp lệ');
      throw new BadRequestException('Chữ ký không hợp lệ');
    }

    const orderId = vnpayResponse.orderId;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: {
          include: {
            transactions: true,
          },
        },
      },
    });

    if (!order) {
      this.logger.error(`Đơn hàng không tồn tại: ${orderId}`);
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
    let transactionStatus: TransactionStatus = TransactionStatus.PENDING;

    if (vnpayResponse.isSuccess) {
      paymentStatus = PaymentStatus.PAID;
      transactionStatus = TransactionStatus.SUCCESS;

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });
    } else {
      paymentStatus = PaymentStatus.FAILED;
      transactionStatus = TransactionStatus.FAILED;
    }

    const payment = await this.prisma.payment.update({
      where: { orderId },
      data: {
        status: paymentStatus,
      },
    });

    const transaction = order.payment?.transactions[0];
    if (transaction) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: transactionStatus,
          transactionId: vnpayResponse.transactionId,
          providerData: {
            bankCode: vnpayResponse.bankCode,
            bankTranNo: vnpayResponse.bankTranNo,
            cardType: vnpayResponse.cardType,
            payDate: vnpayResponse.payDate,
            responseCode: vnpayResponse.responseCode,
          },
          errorMessage:
            transactionStatus === TransactionStatus.FAILED
              ? vnpayResponse.message
              : null,
        },
      });
    }

    return vnpayResponse;
  }

  async queryVnpayDr(
    queryDrDto: VnpayQueryDrDto,
  ): Promise<VnpayPaymentResponseDto> {
    const vnpayResponse = await this.vnpayService.queryDr(queryDrDto);

    if (!vnpayResponse.isValidSignature) {
      this.logger.error('Chữ ký VNPay không hợp lệ');
      throw new BadRequestException('Chữ ký không hợp lệ');
    }

    return vnpayResponse;
  }

  async refundVnpay(
    refundDto: VnpayRefundDto,
  ): Promise<VnpayPaymentResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: refundDto.orderId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    if (!order.payment) {
      throw new BadRequestException('Đơn hàng chưa có thanh toán');
    }

    if (order.payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException(
        'Chỉ có thể hoàn tiền đơn hàng đã thanh toán thành công',
      );
    }

    if (refundDto.amount > order.payment.amount) {
      throw new BadRequestException(
        'Số tiền hoàn không được lớn hơn số tiền đã thanh toán',
      );
    }

    const vnpayResponse = await this.vnpayService.refund(refundDto);

    if (!vnpayResponse.isValidSignature) {
      this.logger.error('Chữ ký VNPay không hợp lệ');
      throw new BadRequestException('Chữ ký không hợp lệ');
    }

    if (vnpayResponse.isSuccess) {
      await this.prisma.payment.update({
        where: { orderId: refundDto.orderId },
        data: {
          status: PaymentStatus.REFUNDED,
        },
      });

      await this.prisma.paymentTransaction.create({
        data: {
          paymentId: order.payment.id,
          transactionId: `REFUND_${Date.now()}`,
          status: TransactionStatus.SUCCESS,
          amount: refundDto.amount,
          paymentMethod: PaymentMethod.VNPAY,
          provider: 'VNPAY',
          providerData: {
            reason: refundDto.reason,
            responseCode: vnpayResponse.responseCode,
          },
        },
      });
    }

    return vnpayResponse;
  }

  async findOne(id: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Thanh toán không tồn tại');
    }

    return this.mapToPaymentResponseDto(payment);
  }

  async findByOrderId(orderId: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: {
        transactions: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Thanh toán không tồn tại');
    }

    return this.mapToPaymentResponseDto(payment);
  }

  private async createOrUpdatePayment(
    payload: PaymentDataDto,
  ): Promise<PaymentResponseDto> {
    const { orderId, orderInfo, ...updateData } = payload;

    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: {
        transactions: true,
      },
    });

    let payment;

    if (existingPayment) {
      payment = await this.prisma.payment.update({
        where: { orderId },
        data: updateData,
        include: {
          transactions: true,
        },
      });
    } else {
      payment = await this.prisma.payment.create({
        data: {
          orderId,
          ...updateData,
        },
        include: {
          transactions: true,
        },
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: payload.paymentMethod,
          paymentStatus: payload.status,
        },
      });
    }

    const paymentResponse = this.mapToPaymentResponseDto(payment);
    paymentResponse.orderInfo = orderInfo || '';
    
    return paymentResponse;
  }

  private async createTransaction(
    transactionData: CreatePaymentTransactionDto,
  ): Promise<void> {
    await this.prisma.paymentTransaction.create({
      data: transactionData,
    });
  }

  private mapToPaymentResponseDto(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      transactionId: payment.transactionId,
      orderInfo: payment.orderInfo,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
