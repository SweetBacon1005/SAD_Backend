import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  ACCESS_TOKEN_EXPIRATION,
  OTP_EXPIRATION_MINUTES,
} from '../common/constants';
import { PrismaService } from '../database/prisma.service';
import { MailService } from '../mail/mail.service';
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

@Injectable()
export class AuthService {
  private readonly OTP_EXPIRATION_MINUTES: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {
    this.OTP_EXPIRATION_MINUTES = OTP_EXPIRATION_MINUTES;
  }

  async signUp(payload: SignUpDto): Promise<{ message: string }> {
    const { email, password, name } = payload;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });


    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw new ConflictException('User already exists');
      } else {
        await this.prisma.user.delete({
          where: { id: existingUser.id },
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    await this.sendEmailVerificationOTP({ email });

    return {
      message:
        'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    };
  }

  async signIn(payload: SignInDto): Promise<{ token: string }> {
    const { email, password } = payload;

    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const token = this.generateJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: true,
    });

    return { token };
  }

  async sendEmailVerificationOTP(
    sendEmailVerificationOTP: SendEmailVerificationOtpDto,
  ): Promise<void> {
    const { email } = sendEmailVerificationOTP;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = this.generateOTP();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: new Date(
          Date.now() + this.OTP_EXPIRATION_MINUTES * 60 * 1000 * 5,
        ),
      },
    });

    await this.mailService.sendEmailVerificationEmail(
      user.email,
      user.name,
      otp,
      this.OTP_EXPIRATION_MINUTES,
    );
  }

  async verifyEmailOTP(
    verifyEmailOtpDto: VerifyEmailOtpDto,
  ): Promise<{ token: string }> {
    const { email, otp } = verifyEmailOtpDto;

    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationOTP: null,
        emailVerificationOTPExpires: null,
      },
    });

    const token = this.generateJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: true,
    });

    return { token };
  }

  async sendPasswordResetOTP(
    sendPasswordResetOtpDto: SendPasswordResetOtpDto,
  ): Promise<void> {
    const { email } = sendPasswordResetOtpDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('No user found with this email');
    }

    const otp = this.generateOTP();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOTP: otp,
        passwordResetOTPExpires: new Date(
          Date.now() + this.OTP_EXPIRATION_MINUTES * 60 * 1000 * 5,
        ),
      },
    });

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.name,
      otp,
      this.OTP_EXPIRATION_MINUTES,
    );
  }

  async verifyPasswordResetOTP(
    payload: VerifyPasswordResetOtpDto,
  ): Promise<{ token: string }> {
    const { email, otp } = payload;

    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        passwordResetOTP: otp,
        passwordResetOTPExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const token = this.jwtService.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        resetPasswordAuth: true,
      },
      { expiresIn: '15m' },
    );

    return { token };
  }

  async resetPassword(payload: ResetPasswordDto): Promise<void> {
    const { email, password, token } = payload;

    try {
      const decoded = this.jwtService.verify(token);

      if (!decoded.resetPasswordAuth) {
        throw new BadRequestException('Invalid reset password token');
      }

      if (decoded.email !== email.toLowerCase()) {
        throw new BadRequestException('Email does not match with token');
      }

      const user = await this.prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
          id: decoded.id,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetOTP: null,
          passwordResetOTPExpires: null,
        },
      });
    } catch (error) {
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        throw new BadRequestException('Invalid or expired token');
      }
      throw error;
    }
  }

  private generateJwtToken(user: {
    id: string;
    email: string;
    role: string;
    isEmailVerified?: boolean;
  }): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified:
        user.isEmailVerified !== undefined ? user.isEmailVerified : true,
    };
    return this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRATION,
    });
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
