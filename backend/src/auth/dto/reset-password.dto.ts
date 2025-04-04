import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  @ApiProperty({
    description: 'OTP sent to the user',
    example: '123456',
  })
  token: string;

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
    description: 'New password of the user',
    example: 'Password@123',
  })
  newPassword: string;
}
