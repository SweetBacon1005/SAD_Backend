import { PrismaService } from '@/database/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import * as moment from 'moment';
import * as qs from 'qs';
import { CreateVnpayPaymentDto } from './dto/create-vnpay-payment.dto';
import { HandleVnpayReturnDto } from './dto/handle-vnpay-return.dto';
import { VnpayIpnDto } from './dto/vnpay-ipn.dto';
import { VnpayQueryDrDto } from './dto/vnpay-query-dr.dto';
import { VnpayRefundDto } from './dto/vnpay-refund.dto';
import { VnpayPaymentResponseDto } from './dto/vnpay-response.dto';

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);
  private readonly vnpUrl: string;
  private readonly vnpReturnUrl: string;
  private readonly vnpTmnCode: string;
  private readonly vnpHashSecret: string;
  private readonly vnpApiVersion: string;
  private readonly vnpIpnUrl: string;
  private readonly vnpApi: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.vnpUrl = this.configService.get<string>('VNPAY_URL') as string;
    this.vnpTmnCode = this.configService.get<string>(
      'VNPAY_TMN_CODE',
    ) as string;
    this.vnpHashSecret = this.configService.get<string>(
      'VNPAY_HASH_SECRET',
    ) as string;
    this.vnpApiVersion = this.configService.get<string>(
      'VNPAY_API_VERSION',
    ) as string;
    this.vnpReturnUrl = this.configService.get<string>(
      'VNPAY_RETURN_URL',
    ) as string;
    this.vnpIpnUrl = this.configService.get<string>('VNPAY_IPN_URL') as string;
    this.vnpApi = this.configService.get<string>('VNPAY_API') as string;
  }

  async createPaymentUrl(
    createPaymentDto: CreateVnpayPaymentDto,
  ): Promise<string> {
    const date = new Date();

    const createDate = this.formatDate(date);

    const orderId = createPaymentDto.orderId;

    const amount = createPaymentDto.amount;
    const orderInfo =
      createPaymentDto.orderInfo || `Thanh toán đơn hàng #${orderId}`;
    const orderType = createPaymentDto.orderType || 'other';
    const locale = createPaymentDto.locale || 'vn';
    const bankCode = createPaymentDto.bankCode || '';
    const ipAddr = createPaymentDto.ipAddr || '127.0.0.1';

    const vnpParams: Record<string, any> = {
      vnp_Version: this.vnpApiVersion,
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnpTmnCode,
      vnp_Amount: Math.round(amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Locale: locale,
      vnp_ReturnUrl: this.vnpReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) {
      vnpParams['vnp_BankCode'] = bankCode;
    }

    const sortedParams = this.sortObject(vnpParams);

    const signData = qs.stringify(sortedParams, { encode: false });

    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams['vnp_SecureHash'] = signed;

    const paymentUrl = `${this.vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`;

    return paymentUrl;
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const M = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    const h = ('0' + date.getHours()).slice(-2);
    const m = ('0' + date.getMinutes()).slice(-2);
    const s = ('0' + date.getSeconds()).slice(-2);
    return `${y}${M}${d}${h}${m}${s}`;
  }

  verifyReturnUrl(vnpParams: HandleVnpayReturnDto): VnpayPaymentResponseDto {
    const secureHash = vnpParams.vnp_SecureHash;

    const { vnp_SecureHash, ...paramsToVerify } = vnpParams;
    console.log(paramsToVerify);

    const sortedParams = this.sortObject(paramsToVerify);

    console.log('sortedParams', sortedParams);

    const signData = qs.stringify(sortedParams, { encode: false });

    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log('secureHash', secureHash);
    console.log('signed', signed);

    const isValidSignature = secureHash === signed;

    const responseCode = vnpParams.vnp_ResponseCode;
    const isSuccess = responseCode === '00';

    return {
      isSuccess,
      isValidSignature,
      amount: parseInt(vnpParams.vnp_Amount) / 100,
      orderId: vnpParams.vnp_TxnRef,
      transactionId: vnpParams.vnp_TransactionNo,
      bankCode: vnpParams.vnp_BankCode,
      bankTranNo: vnpParams.vnp_BankTranNo,
      cardType: vnpParams.vnp_CardType,
      payDate: vnpParams.vnp_PayDate,
      orderInfo: vnpParams.vnp_OrderInfo,
      responseCode,
      message: this.getResponseMessage(responseCode),
    };
  }

  /**
   * Lấy thông điệp từ mã phản hồi
   */
  private getResponseMessage(responseCode: string): string {
    const responseMessages = {
      '00': 'Giao dịch thành công',
      '01': 'Giao dịch đã tồn tại',
      '02': 'Merchant không hợp lệ',
      '03': 'Dữ liệu gửi sang không đúng định dạng',
      '04': 'Khởi tạo GD không thành công do Website đang bị tạm khóa',
      '05': 'Giao dịch không thành công do: Quý khách nhập sai mật khẩu quá số lần quy định',
      '06': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán nhiều lần',
      '99': 'Lỗi không xác định',
    };

    return responseMessages[responseCode] || 'Lỗi không xác định';
  }

  private sortObject(
    obj: Record<string, string | number>,
  ): Record<string, string> {
    let sorted: Record<string, string> = {};
    let str: string[] = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(String(obj[str[key]])).replace(
        /%20/g,
        '+',
      );
    }
    return sorted;
  }

  async handleIpn(vnpParams: VnpayIpnDto): Promise<VnpayPaymentResponseDto> {
    const secureHash = vnpParams.vnp_SecureHash;
    const { vnp_SecureHash, ...paramsToVerify } = vnpParams;

    const sortedParams = this.sortObject(paramsToVerify);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const orderId = vnpParams.vnp_TxnRef;
    const rspCode = vnpParams.vnp_ResponseCode;
    const amount = parseInt(vnpParams.vnp_Amount) / 100;

    if (secureHash !== signed) {
      return {
        isSuccess: false,
        isValidSignature: false,
        amount: 0,
        orderId,
        transactionId: vnpParams.vnp_TransactionNo,
        bankCode: vnpParams.vnp_BankCode,
        bankTranNo: vnpParams.vnp_BankTranNo,
        cardType: vnpParams.vnp_CardType,
        payDate: vnpParams.vnp_PayDate,
        orderInfo: vnpParams.vnp_OrderInfo,
        responseCode: '97',
        message: 'Checksum failed',
      };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return {
        isSuccess: false,
        isValidSignature: true,
        amount: 0,
        orderId,
        transactionId: vnpParams.vnp_TransactionNo,
        bankCode: vnpParams.vnp_BankCode,
        bankTranNo: vnpParams.vnp_BankTranNo,
        cardType: vnpParams.vnp_CardType,
        payDate: vnpParams.vnp_PayDate,
        orderInfo: vnpParams.vnp_OrderInfo,
        responseCode: '01',
        message: 'Order not found',
      };
    }

    if (amount !== order.payment?.amount) {
      return {
        isSuccess: false,
        isValidSignature: true,
        amount: 0,
        orderId,
        transactionId: vnpParams.vnp_TransactionNo,
        bankCode: vnpParams.vnp_BankCode,
        bankTranNo: vnpParams.vnp_BankTranNo,
        cardType: vnpParams.vnp_CardType,
        payDate: vnpParams.vnp_PayDate,
        orderInfo: vnpParams.vnp_OrderInfo,
        responseCode: '04',
        message: 'Amount invalid',
      };
    }

    if (order.payment?.status !== 'PENDING') {
      return {
        isSuccess: false,
        isValidSignature: true,
        amount: 0,
        orderId,
        transactionId: vnpParams.vnp_TransactionNo,
        bankCode: vnpParams.vnp_BankCode,
        bankTranNo: vnpParams.vnp_BankTranNo,
        cardType: vnpParams.vnp_CardType,
        payDate: vnpParams.vnp_PayDate,
        orderInfo: vnpParams.vnp_OrderInfo,
        responseCode: '02',
        message: 'This order has been updated to the payment status',
      };
    }

    if (rspCode === '00') {
      await this.prisma.payment.update({
        where: { orderId },
        data: { status: 'PAID' },
      });
    } else {
      await this.prisma.payment.update({
        where: { orderId },
        data: { status: 'FAILED' },
      });
    }

    return {
      isSuccess: rspCode === '00',
      isValidSignature: true,
      amount,
      orderId,
      transactionId: vnpParams.vnp_TransactionNo,
      bankCode: vnpParams.vnp_BankCode,
      bankTranNo: vnpParams.vnp_BankTranNo,
      cardType: vnpParams.vnp_CardType,
      payDate: vnpParams.vnp_PayDate,
      orderInfo: vnpParams.vnp_OrderInfo,
      responseCode: rspCode,
      message: this.getResponseMessage(rspCode),
    };
  }

  async queryDr(queryDrDto: VnpayQueryDrDto): Promise<VnpayPaymentResponseDto> {
    const date = new Date();
    const vnp_RequestId = moment(date).format('HHmmss');
    const vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');

    const data = [
      vnp_RequestId,
      this.vnpApiVersion,
      'querydr',
      this.vnpTmnCode,
      queryDrDto.orderId,
      queryDrDto.createDate,
      vnp_CreateDate,
      queryDrDto.ipAddr,
      `Truy van GD ma:${queryDrDto.orderId}`,
    ].join('|');

    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const vnp_SecureHash = hmac
      .update(Buffer.from(data, 'utf-8'))
      .digest('hex');

    const dataObj = {
      vnp_RequestId,
      vnp_Version: this.vnpApiVersion,
      vnp_Command: 'querydr',
      vnp_TmnCode: this.vnpTmnCode,
      vnp_TxnRef: queryDrDto.orderId,
      vnp_OrderInfo: `Truy van GD ma:${queryDrDto.orderId}`,
      vnp_TransactionDate: queryDrDto.createDate,
      vnp_CreateDate: vnp_CreateDate,
      vnp_IpAddr: queryDrDto.ipAddr,
      vnp_SecureHash,
    };

    try {
      const response = await axios.post(`${this.vnpApi}`, dataObj);

      if (response.data) {
        const vnpResponse = response.data;
        return {
          isSuccess: vnpResponse.vnp_ResponseCode === '00',
          isValidSignature: true,
          amount: parseInt(vnpResponse.vnp_Amount) / 100,
          orderId: vnpResponse.vnp_TxnRef,
          transactionId: vnpResponse.vnp_TransactionNo,
          bankCode: vnpResponse.vnp_BankCode,
          bankTranNo: vnpResponse.vnp_BankTranNo,
          cardType: vnpResponse.vnp_CardType,
          payDate: vnpResponse.vnp_PayDate,
          orderInfo: vnpResponse.vnp_OrderInfo,
          responseCode: vnpResponse.vnp_ResponseCode,
          message: this.getResponseMessage(vnpResponse.vnp_ResponseCode),
        };
      }

      throw new Error('Không nhận được phản hồi từ VNPay');
    } catch (error) {
      this.logger.error('Lỗi khi truy vấn giao dịch VNPay:', error);
      throw error;
    }
  }

  async refund(refundDto: VnpayRefundDto): Promise<VnpayPaymentResponseDto> {
    const date = new Date();
    const vnp_RequestId = moment(date).format('HHmmss');
    const vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
    const vnp_TransactionNo = '0';

    const data = [
      vnp_RequestId,
      this.vnpApiVersion,
      'refund',
      this.vnpTmnCode,
      refundDto.transType,
      refundDto.orderId,
      Math.round(refundDto.amount * 100),
      vnp_TransactionNo,
      refundDto.transDate,
      refundDto.user,
      vnp_CreateDate,
      refundDto.ipAddr,
      `Hoan tien GD ma:${refundDto.orderId}`,
    ].join('|');

    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const vnp_SecureHash = hmac
      .update(Buffer.from(data, 'utf-8'))
      .digest('hex');

    const dataObj = {
      vnp_RequestId,
      vnp_Version: this.vnpApiVersion,
      vnp_Command: 'refund',
      vnp_TmnCode: this.vnpTmnCode,
      vnp_TransactionType: refundDto.transType,
      vnp_TxnRef: refundDto.orderId,
      vnp_Amount: Math.round(refundDto.amount * 100),
      vnp_TransactionNo,
      vnp_CreateBy: refundDto.user,
      vnp_OrderInfo: `Hoan tien GD ma:${refundDto.orderId}`,
      vnp_TransactionDate: refundDto.transDate,
      vnp_CreateDate,
      vnp_IpAddr: refundDto.ipAddr,
      vnp_SecureHash,
    };

    try {
      const response = await axios.post(this.vnpApi, dataObj);

      if (response.data) {
        const vnpResponse = response.data;
        return {
          isSuccess: vnpResponse.vnp_ResponseCode === '00',
          isValidSignature: true,
          amount: parseInt(vnpResponse.vnp_Amount) / 100,
          orderId: vnpResponse.vnp_TxnRef,
          transactionId: vnpResponse.vnp_TransactionNo,
          bankCode: vnpResponse.vnp_BankCode,
          bankTranNo: vnpResponse.vnp_BankTranNo,
          cardType: vnpResponse.vnp_CardType,
          payDate: vnpResponse.vnp_PayDate,
          orderInfo: vnpResponse.vnp_OrderInfo,
          responseCode: vnpResponse.vnp_ResponseCode,
          message: this.getResponseMessage(vnpResponse.vnp_ResponseCode),
        };
      }

      throw new Error('Không nhận được phản hồi từ VNPay');
    } catch (error) {
      this.logger.error('Lỗi khi hoàn tiền VNPay:', error);
      throw error;
    }
  }
}
