import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AddressResponseDto } from './address-response.dto';

export class UserResponseDto {
  @ApiProperty({ description: 'ID người dùng', example: '6151f3d2e149e32b3404c8b7' })
  id: string;

  @ApiProperty({ description: 'Tên người dùng', example: 'Nguyễn Văn A' })
  name: string;

  @ApiProperty({ description: 'Email người dùng', example: 'nguyenvana@example.com' })
  email: string;

  @ApiProperty({ description: 'Vai trò người dùng', enum: UserRole, example: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty({ description: 'Trạng thái hoạt động', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Email đã xác thực chưa', example: false })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Ngày tạo tài khoản', example: '2023-04-01T10:30:40.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Ngày cập nhật tài khoản', example: '2023-04-02T15:45:22.000Z' })
  updatedAt: Date | null;

  @ApiPropertyOptional({ description: 'Danh sách địa chỉ', type: [AddressResponseDto] })
  addresses?: AddressResponseDto[];
}

export class UserPaginationResponseDto {
  @ApiProperty({ description: 'Danh sách người dùng', type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({
    description: 'Thông tin phân trang',
    example: {
      total: 50,
      pageSize: 10,
      currentPage: 1,
      totalPages: 5,
      hasMore: true,
    },
  })
  pagination: {
    total: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export class ChangeRoleResponseDto {
  @ApiProperty({ description: 'ID người dùng', example: '6151f3d2e149e32b3404c8b7' })
  id: string;

  @ApiProperty({ description: 'Tên người dùng', example: 'Nguyễn Văn A' })
  name: string;

  @ApiProperty({ description: 'Email người dùng', example: 'nguyenvana@example.com' })
  email: string;

  @ApiProperty({ 
    description: 'Vai trò người dùng mới', 
    enum: UserRole, 
    example: UserRole.MANAGER 
  })
  role: UserRole;
}

export class ToggleActiveResponseDto {
  @ApiProperty({ description: 'ID người dùng', example: '6151f3d2e149e32b3404c8b7' })
  id: string;

  @ApiProperty({ description: 'Tên người dùng', example: 'Nguyễn Văn A' })
  name: string;

  @ApiProperty({ description: 'Email người dùng', example: 'nguyenvana@example.com' })
  email: string;

  @ApiProperty({ description: 'Trạng thái hoạt động mới', example: false })
  isActive: boolean;
}

export class DeleteUserResponseDto {
  @ApiProperty({ 
    description: 'Thông báo kết quả', 
    example: 'User deleted successfully' 
  })
  message: string;
}

export class DeleteAddressResponseDto {
  @ApiProperty({ 
    description: 'Thông báo kết quả', 
    example: 'Address deleted successfully' 
  })
  message: string;
} 