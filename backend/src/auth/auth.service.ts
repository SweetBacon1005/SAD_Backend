import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { FRONTEND_URL, OTP_EXPIRATION_MINUTES } from '../common/constants';
import { PrismaService } from '../database/prisma.service';
import { MailService } from '../mail/mail.service';
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

@Injectable()
export class AuthService {
  private readonly FRONTEND_URL: string;
  private readonly OTP_EXPIRATION_MINUTES: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {
    this.FRONTEND_URL = FRONTEND_URL;
    this.OTP_EXPIRATION_MINUTES = OTP_EXPIRATION_MINUTES;
  }

  async signUp(payload: SignUpDto): Promise<{ token: string }> {
    const { email, password, name } = payload;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
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

    const token = this.generateJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { token };
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

    const token = this.generateJwtToken(user);

    return { token };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('No user found with this email');
    }

    this.sendEmailVerificationOTP({ email });
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
          Date.now() + this.OTP_EXPIRATION_MINUTES * 60 * 1000,
        ),
      },
    });

    // Send OTP via email
    await this.mailService.sendMail({
      to: user.email,
      subject: 'Email Verification OTP',
      template: 'email-otp',
      context: {
        name: user.name,
        otp,
        expirationMinutes: this.OTP_EXPIRATION_MINUTES,
      },
    });
  }

  async verifyEmailOTP(verifyEmailOtpDto: VerifyEmailOtpDto): Promise<void> {
    const { email, otp } = verifyEmailOtpDto;

    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationOTP: null,
        emailVerificationOTPExpires: null,
      },
    });
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

    // Generate OTP
    const otp = this.generateOTP();

    // Update user with OTP and expiration
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOTP: otp,
        passwordResetOTPExpires: new Date(
          Date.now() + this.OTP_EXPIRATION_MINUTES * 60 * 1000,
        ),
      },
    });

    // Send OTP via email
    await this.mailService.sendMail({
      to: user.email,
      subject: 'Password Reset OTP',
      template: 'password-reset-otp',
      context: {
        name: user.name,
        otp,
        expirationMinutes: this.OTP_EXPIRATION_MINUTES,
      },
    });
  }

  async verifyPasswordResetOTP(
    verifyPasswordResetOtpDto: VerifyPasswordResetOtpDto,
  ): Promise<{ token: string }> {
    const { email, otp } = verifyPasswordResetOtpDto;

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

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOTP: null,
        passwordResetOTPExpires: null,
      },
    });

    const token = this.jwtService.sign({ email: user.email });

    return { token };
  }

  async resetPassword(payload: ResetPasswordDto): Promise<void> {
    const { newPassword, token } = payload;

    try {
      const { email } = this.jwtService.verify(token);

      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
        },
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private generateJwtToken(user: {
    id: string;
    email: string;
    role: string;
  }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
