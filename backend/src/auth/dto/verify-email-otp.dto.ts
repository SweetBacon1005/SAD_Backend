import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsString,
  MaxLength,
  MinLength,
  Length,
} from 'class-validator';

export class VerifyEmailOtpDto {
  @ApiProperty({
    description: 'Email cần xác thực',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    description: 'Mã OTP gồm 6 chữ số',
    example: '123456',
  })
  @IsNumberString({}, { message: 'OTP phải là chuỗi số' })
  @Length(6, 6, { message: 'OTP phải có đúng 6 chữ số' })
  @IsNotEmpty({ message: 'OTP không được để trống' })
  otp: string;
}

export class SendEmailVerificationOtpDto {
  @ApiProperty({
    description: 'Email cần xác thực',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}
