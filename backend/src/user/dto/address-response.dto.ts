import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressResponseDto {
  @ApiProperty({ description: 'ID của địa chỉ', example: '6151f3d2e149e32b3404c8c1' })
  id: string;

  @ApiProperty({ description: 'ID của người dùng', example: '6151f3d2e149e32b3404c8b7' })
  userId: string;

  @ApiProperty({ description: 'Địa chỉ chi tiết', example: '123 Đường Lê Lợi, Phường Bến Nghé' })
  addressLine: string;

  @ApiProperty({ description: 'Số điện thoại', example: '0901234567' })
  phone: string;

  @ApiPropertyOptional({ description: 'Thành phố', example: 'TP. Hồ Chí Minh' })
  city: string | null;

  @ApiPropertyOptional({ description: 'Tỉnh/Thành phố', example: 'Hồ Chí Minh' })
  state: string | null;

  @ApiPropertyOptional({ description: 'Quốc gia', example: 'Việt Nam' })
  country: string | null;

  @ApiPropertyOptional({ description: 'Mã bưu điện', example: '700000' })
  postalCode: string | null;

  @ApiProperty({ description: 'Là địa chỉ mặc định hay không', example: true })
  isDefault: boolean;
}

export class AddressListResponseDto {
  @ApiProperty({ description: 'Danh sách địa chỉ', type: [AddressResponseDto] })
  addresses: AddressResponseDto[];
} 