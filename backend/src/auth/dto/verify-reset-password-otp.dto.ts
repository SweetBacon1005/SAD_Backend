import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class VerifyPasswordResetOtpDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  @ApiProperty()
  otp: string;
}

export class SendPasswordResetOtpDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;
}
