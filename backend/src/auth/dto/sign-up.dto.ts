import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class SignUpDto {
  @ApiProperty({
    description: 'Email đăng ký tài khoản',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    description: 'Tên người dùng',
    example: 'Nguyễn Văn A',
  })
  @IsString({ message: 'Tên phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @Length(2, 50, { message: 'Tên phải từ 2-50 ký tự' })
  name: string;

  @ApiProperty({
    description: 'Mật khẩu đăng ký',
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




