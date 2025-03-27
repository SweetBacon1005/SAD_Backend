import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class VerifyEmailOtpDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: "trungdz10052003@gmail.com"
  })
  email: string;

  @IsNumberString()
  @MinLength(6)
  @MaxLength(6)
  @ApiProperty({
    example: '123456',
  })
  otp: string;
}

export class SendEmailVerificationOtpDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;
}
