import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'querystring';
import { CreateVnpayPaymentDto } from './dto/create-vnpay-payment.dto';
import { VnpayPaymentResponseDto } from './dto/vnpay-response.dto';

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);
  private readonly vnpUrl: string;
  private readonly vnpReturnUrl: string;
  private readonly vnpTmnCode: string;
  private readonly vnpHashSecret: string;
  private readonly vnpApiVersion: string;

  constructor(private configService: ConfigService) {
    this.vnpUrl = this.configService.get<string>('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
    this.vnpTmnCode = this.configService.get<string>('VNPAY_TMN_CODE', 'your-tmn-code');
    this.vnpHashSecret = this.configService.get<string>('VNPAY_HASH_SECRET', 'your-hash-secret');
    this.vnpApiVersion = this.configService.get<string>('VNPAY_API_VERSION', '2.1.0');
    this.vnpReturnUrl = this.configService.get<string>('VNPAY_RETURN_URL', 'http://localhost:3000/payment/vnpay-return');
  }

  /**
   * Tạo URL thanh toán VNPay
   */
  async createPaymentUrl(createPaymentDto: CreateVnpayPaymentDto): Promise<string> {
    const date = new Date();
    const createDate = this.formatDate(date);
    
    const orderId = createPaymentDto.orderId;
    const amount = createPaymentDto.amount;
    const orderInfo = createPaymentDto.orderInfo || `Thanh toán cho đơn hàng #${orderId}`;
    const orderType = createPaymentDto.orderType || '190000'; // Mặc định là thanh toán hóa đơn
    const locale = createPaymentDto.locale || 'vn';
    
    // Tạo các tham số gửi cho VNPay
    const params = {
      vnp_Version: this.vnpApiVersion,
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnpTmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: amount * 100, // Số tiền * 100 (VNPay tính theo đơn vị 100 đồng)
      vnp_ReturnUrl: this.vnpReturnUrl,
      vnp_IpAddr: createPaymentDto.ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    // Sắp xếp các tham số theo thứ tự a-z
    const sortedParams = this.sortObject(params);
    
    // Tạo chuỗi hash để xác thực
    const signData = querystring.stringify(sortedParams, undefined, undefined, { encodeURIComponent: (str) => str });
    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    // Thêm chữ ký vào tham số
    sortedParams['vnp_SecureHash'] = signed;

    // Tạo URL thanh toán
    const paymentUrl = `${this.vnpUrl}?${querystring.stringify(sortedParams, undefined, undefined, { encodeURIComponent: (str) => str })}`;
    
    return paymentUrl;
  }

  /**
   * Xác minh callback từ VNPay
   */
  verifyReturnUrl(vnpParams: any): VnpayPaymentResponseDto {
    const secureHash = vnpParams['vnp_SecureHash'];
    
    // Xóa chữ ký để tạo lại chuỗi hash
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];
    
    // Sắp xếp các tham số theo thứ tự a-z
    const sortedParams = this.sortObject(vnpParams);
    
    // Tạo chuỗi hash để xác thực
    const signData = querystring.stringify(sortedParams, undefined, undefined, { encodeURIComponent: (str) => str });
    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    // Kiểm tra chữ ký
    const isValidSignature = secureHash === signed;
    
    // Lấy kết quả thanh toán
    const responseCode = vnpParams['vnp_ResponseCode'];
    const isSuccess = responseCode === '00';
    
    // Trả về thông tin thanh toán
    return {
      isSuccess,
      isValidSignature,
      amount: parseInt(vnpParams['vnp_Amount']) / 100, // Chuyển về đơn vị VND
      orderId: vnpParams['vnp_TxnRef'],
      transactionId: vnpParams['vnp_TransactionNo'],
      bankCode: vnpParams['vnp_BankCode'],
      bankTranNo: vnpParams['vnp_BankTranNo'],
      cardType: vnpParams['vnp_CardType'],
      payDate: vnpParams['vnp_PayDate'],
      orderInfo: vnpParams['vnp_OrderInfo'],
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

  /**
   * Định dạng ngày tháng theo định dạng của VNPay
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * Sắp xếp các tham số theo thứ tự a-z
   */
  private sortObject(obj: any): any {
    const sorted: any = {};
    const keys = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    
    keys.sort();
    
    for (const i in keys) {
      if (keys.hasOwnProperty(i)) {
        const key = keys[i];
        sorted[key] = obj[key];
      }
    }
    
    return sorted;
  }
} 