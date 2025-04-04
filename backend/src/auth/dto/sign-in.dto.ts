import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: "trungdz10052003@gmail.com"
  })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase, one lowercase, one number and one special character',
    },
  )
  @ApiProperty({
    example: 'Password@123',
  })
  password: string;
}
