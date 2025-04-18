import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/role.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import {
  SendEmailVerificationOtpDto,
  VerifyEmailOtpDto,
} from './dto/verify-email-otp.dto';
import {
  SendPasswordResetOtpDto,
  VerifyPasswordResetOtpDto,
} from './dto/verify-reset-password-otp.dto';

@ApiTags('auth')
@Controller('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async signUp(@Body() payload: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(payload);
  }

  @Public()
  @Post('sign-in')
  @ApiOperation({ summary: 'Đăng nhập vào hệ thống' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Thông tin đăng nhập không chính xác',
  })
  async signIn(@Body() payload: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(payload);
  }

  // @Public()
  // @Post('forgot-password')
  // @ApiOperation({ summary: 'Yêu cầu khôi phục mật khẩu' })
  // @ApiResponse({ status: 200, description: 'Đã gửi email khôi phục mật khẩu' })
  // @ApiResponse({ status: 400, description: 'Email không tồn tại' })
  // async forgotPassword(@Body() payload: ForgotPasswordDto): Promise<void> {
  //   return this.authService.forgotPassword(payload);
  // }

  @Public()
  @Post('send-verification-otp')
  @ApiOperation({ summary: 'Gửi mã OTP xác thực email' })
  @ApiResponse({ status: 200, description: 'Đã gửi mã OTP xác thực email' })
  @ApiResponse({ status: 400, description: 'Email không tồn tại' })
  async sendEmailVerificationOTP(
    @Body() payload: SendEmailVerificationOtpDto,
  ): Promise<void> {
    return this.authService.sendEmailVerificationOTP(payload);
  }

  @Public()
  @Post('verify-email-otp')
  @ApiOperation({ summary: 'Xác thực email bằng mã OTP' })
  @ApiResponse({ status: 200, description: 'Xác thực email thành công' })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async verifyEmailOTP(@Body() payload: VerifyEmailOtpDto): Promise<void> {
    return this.authService.verifyEmailOTP(payload);
  }

  @Roles(UserRole.CUSTOMER)
  @Public()
  @Post('send-password-reset-otp')
  @ApiOperation({ summary: 'Gửi mã OTP đặt lại mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đã gửi mã OTP đặt lại mật khẩu' })
  @ApiResponse({ status: 400, description: 'Email không tồn tại' })
  async sendPasswordResetOTP(
    @Body() payload: SendPasswordResetOtpDto,
  ): Promise<void> {
    return this.authService.sendPasswordResetOTP(payload);
  }

  @Roles(UserRole.CUSTOMER)
  @Public()
  @Post('verify-password-reset-otp')
  @ApiOperation({ summary: 'Xác thực mã OTP đặt lại mật khẩu' })
  @ApiResponse({
    status: 200,
    description: 'Xác thực mã OTP thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async verifyPasswordResetOTP(
    @Body() payload: VerifyPasswordResetOtpDto,
  ): Promise<AuthResponseDto> {
    return this.authService.verifyPasswordResetOTP(payload);
  }

  @Roles(UserRole.CUSTOMER)
  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu mới' })
  @ApiResponse({ status: 200, description: 'Đặt lại mật khẩu thành công' })
  @ApiResponse({
    status: 400,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  async resetPassword(@Body() payload: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(payload);
  }
}
