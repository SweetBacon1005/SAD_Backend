import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/role.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SendEmailVerificationOtpDto } from './dto/verify-email-otp.dto';
import {
  SendPasswordResetOtpDto,
  VerifyPasswordResetOtpDto,
} from './dto/verify-reset-password-otp.dto';

@Controller('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  async signUp(@Body() payload: SignUpDto) {
    return this.authService.signUp(payload);
  }

  @Public()
  @Post('sign-in')
  async signIn(@Body() payload: SignInDto) {
    return this.authService.signIn(payload);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(payload);
  }

  @Public()
  @Post('send-verification-otp')
  async sendEmailVerificationOTP(@Body() payload: SendEmailVerificationOtpDto) {
    return this.authService.sendEmailVerificationOTP(payload);
  }

  @Public()
  @Post('verify-email-otp')
  async verifyEmailOTP(@Body() payload: VerifyPasswordResetOtpDto) {
    return this.authService.verifyEmailOTP(payload);
  }

  @Roles(UserRole.CUSTOMER)
  @Post('send-password-reset-otp')
  async sendPasswordResetOTP(@Body() payload: SendPasswordResetOtpDto) {
    return this.authService.sendPasswordResetOTP(payload);
  }

  @Roles(UserRole.CUSTOMER)
  @Post('verify-password-reset-otp')
  async verifyPasswordResetOTP(@Body() payload: VerifyPasswordResetOtpDto) {
    return this.authService.verifyPasswordResetOTP(payload);
  }

  @Roles(UserRole.CUSTOMER)
  @Post('reset-password')
  async resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload);
  }
}
