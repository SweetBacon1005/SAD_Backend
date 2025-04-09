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

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private vnpayService: VnpayService,
  ) {}

  async create(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: createPaymentDto.orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    if (order.payment) {
      if (order.payment.status === PaymentStatus.PAID) {
        throw new BadRequestException(
          'Đơn hàng này đã được thanh toán thành công',
        );
      }
    }

    let paymentData: any = {
      orderId: createPaymentDto.orderId,
      status: PaymentStatus.PENDING,
      paymentMethod: createPaymentDto.paymentMethod,
      amount: createPaymentDto.amount,
    };

    let payment = await this.createOrUpdatePayment(paymentData);
    let paymentResponse: PaymentResponseDto =
      this.mapToPaymentResponseDto(payment);

    if (createPaymentDto.paymentMethod === PaymentMethod.VNPAY) {
      const paymentUrl = await this.vnpayService.createPaymentUrl({
        orderId: createPaymentDto.orderId,
        amount: createPaymentDto.amount,
      });

      const transactionData: CreatePaymentTransactionDto = {
        paymentId: payment.id,
        transactionId: `VNPAY_${Date.now()}`,
        status: TransactionStatus.PENDING,
        amount: createPaymentDto.amount,
        paymentMethod: PaymentMethod.VNPAY,
        provider: 'VNPAY',
        providerData: {
          paymentUrl,
        },
      };

      await this.createTransaction(transactionData);
      paymentResponse.paymentUrl = paymentUrl;
    }

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

    // Cập nhật thanh toán
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
    let transactionStatus: TransactionStatus = TransactionStatus.PENDING;

    if (vnpayResponse.isSuccess) {
      paymentStatus = PaymentStatus.PAID;
      transactionStatus = TransactionStatus.SUCCESS;

      // Cập nhật trạng thái đơn hàng
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

    // Cập nhật thông tin thanh toán
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

    // Cập nhật thanh toán
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
    let transactionStatus: TransactionStatus = TransactionStatus.PENDING;

    if (vnpayResponse.isSuccess) {
      paymentStatus = PaymentStatus.PAID;
      transactionStatus = TransactionStatus.SUCCESS;

      // Cập nhật trạng thái đơn hàng
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

    // Cập nhật thông tin thanh toán
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
      // Cập nhật trạng thái thanh toán
      await this.prisma.payment.update({
        where: { orderId: refundDto.orderId },
        data: {
          status: PaymentStatus.REFUNDED,
        },
      });

      // Tạo giao dịch hoàn tiền
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

  /**
   * Lấy thông tin thanh toán
   */
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
    paymentData: any,
  ): Promise<PaymentResponseDto> {
    const { orderId, ...updateData } = paymentData;

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
        data: paymentData,
        include: {
          transactions: true,
        },
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: paymentData.paymentMethod,
          paymentStatus: paymentData.status,
        },
      });
    }

    return this.mapToPaymentResponseDto(payment);
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
