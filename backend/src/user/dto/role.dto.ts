import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';

export class ChangeRoleDto {
  @ApiProperty({ 
    description: 'Vai trò mới của người dùng', 
    enum: UserRole, 
    example: UserRole.MANAGER 
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
} 