import { FRONTEND_URL } from '@/common/constants';
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
import { NotificationGateway } from '../notification/notification.gateway';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { HandleVnpayReturnDto } from './dto/handle-vnpay-return.dto';
import { PaymentDataDto } from './dto/payment-data.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { CreatePaymentTransactionDto } from './dto/payment-transaction.dto';
import { VnpayIpnDto } from './dto/vnpay-ipn.dto';
import { VnpayPaymentResponseDto } from './dto/vnpay-response.dto';
import { VnpayService } from './vnpay.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private FRONTEND_URL: string;

  constructor(
    private prisma: PrismaService,
    private vnpayService: VnpayService,
    private notificationGateway: NotificationGateway,
  ) {
    this.FRONTEND_URL = FRONTEND_URL;
  }

  private validatePaymentMethod(paymentMethod: PaymentMethod): void {
    if (!paymentMethod) {
      throw new BadRequestException(
        'Phương thức thanh toán không được để trống',
      );
    }

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new BadRequestException('Phương thức thanh toán không hợp lệ');
    }

    // Kiểm tra các phương thức thanh toán đang được hỗ trợ
    const supportedPaymentMethods = [PaymentMethod.COD, PaymentMethod.VNPAY];

    if (!supportedPaymentMethods.includes(paymentMethod)) {
      throw new BadRequestException(
        `Phương thức thanh toán ${paymentMethod} chưa được hỗ trợ. Các phương thức được hỗ trợ: ${supportedPaymentMethods.join(', ')}`,
      );
    }

    // Kiểm tra điều kiện đặc biệt cho từng phương thức thanh toán
    if (paymentMethod === PaymentMethod.COD) {
      // Kiểm tra giới hạn số tiền cho COD
      const codLimit = 100000000; // 100 triệu VND
      if (this.currentOrderTotal > codLimit) {
        throw new BadRequestException(
          `Phương thức thanh toán COD chỉ áp dụng cho đơn hàng có giá trị không vượt quá ${codLimit.toLocaleString('vi-VN')}đ`,
        );
      }
    }
  }

  private currentOrderTotal: number = 0;

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
      this.logger.error(
        `Người dùng ${userId} không có quyền thanh toán đơn hàng ${order.id}`,
      );
      throw new BadRequestException(
        'Bạn không có quyền thanh toán đơn hàng này',
      );
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Đơn hàng này đã được thanh toán thành công',
      );
    }

    const paymentAmount = order.total;
    this.currentOrderTotal = paymentAmount;

    if (paymentAmount <= 0) {
      throw new BadRequestException('Số tiền thanh toán không hợp lệ');
    }

    // Validate payment method
    this.validatePaymentMethod(payload.paymentMethod);

    const paymentData = {
      orderId: order.id,
      status: PaymentStatus.PENDING,
      paymentMethod: payload.paymentMethod,
      amount: paymentAmount,
      orderInfo: payload.orderInfo || `Thanh toán đơn hàng #${order.id}`,
    };

    let payment = await this.createOrUpdatePayment(paymentData);
    let paymentResponse: PaymentResponseDto =
      this.mapToPaymentResponseDto(payment);

    // Chỉ tạo mã VNPAY nếu phương thức thanh toán là VNPAY
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
    } else if (payload.paymentMethod === PaymentMethod.COD) {
      // Tạo transaction cho COD
      const transactionData: CreatePaymentTransactionDto = {
        paymentId: payment.id,
        transactionId: `COD_${Date.now()}`,
        status: TransactionStatus.PENDING,
        amount: paymentAmount,
        paymentMethod: PaymentMethod.COD,
        provider: 'COD',
        providerData: {
          status: 'PENDING',
          note: 'Chờ xác nhận đơn hàng',
        },
      };

      await this.createTransaction(transactionData);
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: payload.paymentMethod,
      },
    });

    // Tạo thông báo khi tạo thanh toán mới
    await this.notificationGateway.sendNotification(order.userId, {
      type: 'PAYMENT_STATUS',
      title: 'Tạo thanh toán mới',
      message: `Đơn hàng #${order.id} đã được tạo thanh toán với số tiền ${paymentAmount.toLocaleString('vi-VN')}đ${payload.paymentMethod === PaymentMethod.COD ? ' (Thanh toán khi nhận hàng)' : ''}`,
      data: {
        orderId: order.id,
        paymentId: payment.id,
        amount: paymentAmount,
        paymentMethod: payload.paymentMethod,
      },
    });
    return paymentResponse;
  }

  private getVnpayErrorMessage(responseCode: string): string {
    const errorMessages: { [key: string]: string } = {
      '00': 'Giao dịch thành công',
      '01': 'Giao dịch chưa hoàn tất',
      '02': 'Giao dịch bị lỗi',
      '03': 'Mã đơn hàng không tồn tại',
      '04': 'Số tiền không hợp lệ',
      '05': 'Thông tin tài khoản không hợp lệ',
      '06': 'Tài khoản không đủ số dư',
      '07': 'Lỗi kết nối đến ngân hàng',
      '08': 'Giao dịch bị hủy',
      '09': 'Giao dịch bị từ chối',
      '10': 'Giao dịch hết hạn',
      '11': 'Giao dịch bị lỗi do lỗi hệ thống',
      '12': 'Giao dịch bị lỗi do lỗi xác thực',
      '13': 'Giao dịch bị lỗi do lỗi dữ liệu',
      '14': 'Giao dịch bị lỗi do lỗi bảo mật',
      '15': 'Giao dịch bị lỗi do lỗi kết nối',
      '16': 'Giao dịch bị lỗi do lỗi timeout',
      '17': 'Giao dịch bị lỗi do lỗi xử lý',
      '18': 'Giao dịch bị lỗi do lỗi định dạng',
      '19': 'Giao dịch bị lỗi do lỗi cấu hình',
      '20': 'Giao dịch bị lỗi do lỗi chữ ký',
      '21': 'Giao dịch bị lỗi do lỗi mã hóa',
      '22': 'Giao dịch bị lỗi do lỗi giải mã',
      '23': 'Giao dịch bị lỗi do lỗi xác thực chữ ký',
      '24': 'Giao dịch bị lỗi do lỗi xác thực mã hóa',
      '25': 'Giao dịch bị lỗi do lỗi xác thực giải mã',
      '26': 'Giao dịch bị lỗi do lỗi xác thực dữ liệu',
      '27': 'Giao dịch bị lỗi do lỗi xác thực bảo mật',
      '28': 'Giao dịch bị lỗi do lỗi xác thực kết nối',
      '29': 'Giao dịch bị lỗi do lỗi xác thực timeout',
      '30': 'Giao dịch bị lỗi do lỗi xác thực xử lý',
      '31': 'Giao dịch bị lỗi do lỗi xác thực định dạng',
      '32': 'Giao dịch bị lỗi do lỗi xác thực cấu hình',
      '33': 'Giao dịch bị lỗi do lỗi xác thực chữ ký',
      '34': 'Giao dịch bị lỗi do lỗi xác thực mã hóa',
      '35': 'Giao dịch bị lỗi do lỗi xác thực giải mã',
      '36': 'Giao dịch bị lỗi do lỗi xác thực dữ liệu',
      '37': 'Giao dịch bị lỗi do lỗi xác thực bảo mật',
      '38': 'Giao dịch bị lỗi do lỗi xác thực kết nối',
      '39': 'Giao dịch bị lỗi do lỗi xác thực timeout',
      '40': 'Giao dịch bị lỗi do lỗi xác thực xử lý',
    };

    return errorMessages[responseCode] || 'Lỗi không xác định';
  }

  async handleVnpayReturn(
    vnpParams: HandleVnpayReturnDto,
  ): Promise<VnpayPaymentResponseDto> {
    vnpParams.vnp_OrderInfo = decodeURIComponent(
      vnpParams.vnp_OrderInfo.replace(/\+/g, ' '),
    );
    console.log('vnpParams', vnpParams);

    const vnpayResponse = this.vnpayService.verifyReturnUrl(vnpParams);
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
    const errorMessage = this.getVnpayErrorMessage(vnpayResponse.responseCode);

    if (vnpayResponse.isSuccess) {
      if (!vnpayResponse.isValidSignature) {
        this.logger.error('Chữ ký VNPay không hợp lệ cho giao dịch thành công');
        throw new BadRequestException('Chữ ký không hợp lệ');
      }

      paymentStatus = PaymentStatus.PAID;
      transactionStatus = TransactionStatus.SUCCESS;

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });

      await this.notificationGateway.sendNotification(order.userId, {
        type: 'PAYMENT_STATUS',
        title: 'Thanh toán thành công',
        message: `Đơn hàng #${orderId} đã được thanh toán thành công qua VNPAY`,
        data: {
          orderId,
          paymentId: order.payment?.id,
          amount: order.payment?.amount,
          transactionId: vnpayResponse.transactionId,
        },
      });
    } else {
      paymentStatus = PaymentStatus.FAILED;
      transactionStatus = TransactionStatus.FAILED;

      await this.notificationGateway.sendNotification(order.userId, {
        type: 'PAYMENT_STATUS',
        title: 'Thanh toán thất bại',
        message: `Đơn hàng #${orderId} thanh toán thất bại: ${errorMessage}`,
        data: {
          orderId,
          paymentId: order.payment?.id,
          error: errorMessage,
          responseCode: vnpayResponse.responseCode,
        },
      });
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
            errorMessage: errorMessage,
          },
          errorMessage:
            transactionStatus === TransactionStatus.FAILED
              ? errorMessage
              : null,
        },
      });
    }

    return vnpayResponse;
  }

  // async handleVnpayIpn(
  //   vnpParams: VnpayIpnDto,
  // ): Promise<VnpayPaymentResponseDto> {
  //   const vnpayResponse = await this.vnpayService.handleIpn(vnpParams);

  //   if (!vnpayResponse.isValidSignature) {
  //     this.logger.error('Chữ ký VNPay không hợp lệ');
  //     throw new BadRequestException('Chữ ký không hợp lệ');
  //   }

  //   const orderId = vnpayResponse.orderId;

  //   const order = await this.prisma.order.findUnique({
  //     where: { id: orderId },
  //     include: {
  //       payment: {
  //         include: {
  //           transactions: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!order) {
  //     this.logger.error(`Đơn hàng không tồn tại: ${orderId}`);
  //     throw new NotFoundException('Đơn hàng không tồn tại');
  //   }

  //   let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
  //   let transactionStatus: TransactionStatus = TransactionStatus.PENDING;

  //   if (vnpayResponse.isSuccess) {
  //     paymentStatus = PaymentStatus.PAID;
  //     transactionStatus = TransactionStatus.SUCCESS;

  //     await this.prisma.order.update({
  //       where: { id: orderId },
  //       data: {
  //         paymentStatus: PaymentStatus.PAID,
  //       },
  //     });
  //   } else {
  //     paymentStatus = PaymentStatus.FAILED;
  //     transactionStatus = TransactionStatus.FAILED;
  //   }

  //   const payment = await this.prisma.payment.update({
  //     where: { orderId },
  //     data: {
  //       status: paymentStatus,
  //     },
  //   });

  //   const transaction = order.payment?.transactions[0];
  //   if (transaction) {
  //     await this.prisma.paymentTransaction.update({
  //       where: { id: transaction.id },
  //       data: {
  //         status: transactionStatus,
  //         transactionId: vnpayResponse.transactionId,
  //         providerData: {
  //           bankCode: vnpayResponse.bankCode,
  //           bankTranNo: vnpayResponse.bankTranNo,
  //           cardType: vnpayResponse.cardType,
  //           payDate: vnpayResponse.payDate,
  //           responseCode: vnpayResponse.responseCode,
  //         },
  //         errorMessage:
  //           transactionStatus === TransactionStatus.FAILED
  //             ? vnpayResponse.message
  //             : null,
  //       },
  //     });
  //   }

  //   return vnpayResponse;
  // }

  // async queryVnpayDr(
  //   queryDrDto: VnpayQueryDrDto,
  // ): Promise<VnpayPaymentResponseDto> {
  //   const vnpayResponse = await this.vnpayService.queryDr(queryDrDto);

  //   if (!vnpayResponse.isValidSignature) {
  //     this.logger.error('Chữ ký VNPay không hợp lệ');
  //     throw new BadRequestException('Chữ ký không hợp lệ');
  //   }

  //   return vnpayResponse;
  // }

  // async refundVnpay(
  //   refundDto: VnpayRefundDto,
  // ): Promise<VnpayPaymentResponseDto> {
  //   const order = await this.prisma.order.findUnique({
  //     where: { id: refundDto.orderId },
  //     include: {
  //       payment: true,
  //     },
  //   });

  //   if (!order) {
  //     throw new NotFoundException('Đơn hàng không tồn tại');
  //   }

  //   if (!order.payment) {
  //     throw new BadRequestException('Đơn hàng chưa có thanh toán');
  //   }

  //   if (order.payment.status !== PaymentStatus.PAID) {
  //     throw new BadRequestException(
  //       'Chỉ có thể hoàn tiền đơn hàng đã thanh toán thành công',
  //     );
  //   }

  //   if (refundDto.amount > order.payment.amount) {
  //     throw new BadRequestException(
  //       'Số tiền hoàn không được lớn hơn số tiền đã thanh toán',
  //     );
  //   }

  //   const vnpayResponse = await this.vnpayService.refund(refundDto);

  //   if (!vnpayResponse.isValidSignature) {
  //     this.logger.error('Chữ ký VNPay không hợp lệ');
  //     throw new BadRequestException('Chữ ký không hợp lệ');
  //   }

  //   if (vnpayResponse.isSuccess) {
  //     await this.prisma.payment.update({
  //       where: { orderId: refundDto.orderId },
  //       data: {
  //         status: PaymentStatus.REFUNDED,
  //       },
  //     });

  //     // Tạo thông báo khi hoàn tiền thành công
  //     await this.notificationService.createNotification({
  //       userId: order.userId,
  //       type: 'PAYMENT_STATUS',
  //       title: 'Hoàn tiền thành công',
  //       message: `Đơn hàng #${refundDto.orderId} đã được hoàn tiền ${refundDto.amount.toLocaleString('vi-VN')}đ`,
  //       data: {
  //         orderId: refundDto.orderId,
  //         paymentId: order.payment?.id,
  //         amount: refundDto.amount,
  //         reason: refundDto.reason,
  //       },
  //     });

  //     await this.prisma.paymentTransaction.create({
  //       data: {
  //         paymentId: order.payment.id,
  //         transactionId: `REFUND_${Date.now()}`,
  //         status: TransactionStatus.SUCCESS,
  //         amount: refundDto.amount,
  //         paymentMethod: PaymentMethod.VNPAY,
  //         provider: 'VNPAY',
  //         providerData: {
  //           reason: refundDto.reason,
  //           responseCode: vnpayResponse.responseCode,
  //         },
  //       },
  //     });
  //   }

  //   return vnpayResponse;
  // }

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
