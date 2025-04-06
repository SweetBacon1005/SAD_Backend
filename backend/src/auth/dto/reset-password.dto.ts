import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email tài khoản cần đặt lại mật khẩu',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    description: 'Mã OTP dùng để xác thực',
    example: '123456',
  })
  @IsString({ message: 'OTP phải là chuỗi' })
  @Length(6, 6, { message: 'OTP phải có đúng 6 ký tự' })
  @IsNotEmpty({ message: 'OTP không được để trống' })
  otp: string;

  @ApiProperty({
    description: 'Mật khẩu mới của tài khoản',
    example: 'Password@123',
  })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @Length(8, 20, { message: 'Mật khẩu phải từ 8-20 ký tự' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt',
    },
  )
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}
