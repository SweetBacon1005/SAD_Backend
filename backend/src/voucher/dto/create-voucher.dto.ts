import { ApiProperty } from '@nestjs/swagger';
import { DiscountType, VoucherApplicable } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateVoucherDto {
  @ApiProperty({
    description: 'Mã voucher',
    example: 'SUMMER2023',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Tên voucher',
    example: 'Khuyến mãi mùa hè 2023',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Mô tả voucher',
    example: 'Giảm giá 10% cho tất cả sản phẩm trong mùa hè 2023',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Loại giảm giá',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({
    description: 'Giá trị giảm giá (% hoặc số tiền cố định)',
    example: 10,
  })
  @IsNumber()
  @IsPositive()
  @Max(100, { message: 'Giá trị giảm giá theo % không thể vượt quá 100%' })
  discountValue: number;

  @ApiProperty({
    description: 'Giá trị đơn hàng tối thiểu để áp dụng voucher',
    example: 100000,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiProperty({
    description: 'Giá trị giảm giá tối đa',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxDiscount?: number;

  @ApiProperty({
    description: 'Ngày bắt đầu hiệu lực',
    example: '2025-04-20T00:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Ngày kết thúc hiệu lực',
    example: '2025-04-25T23:59:59Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Trạng thái kích hoạt',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Giới hạn số lần sử dụng',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  usageLimit?: number;

  @ApiProperty({
    description: 'Đối tượng áp dụng voucher',
    enum: VoucherApplicable,
    default: VoucherApplicable.ALL,
    required: false,
  })
  @IsOptional()
  @IsEnum(VoucherApplicable)
  applicableFor?: VoucherApplicable;

  @ApiProperty({
    description: 'Điều kiện áp dụng voucher',
    example: {
      userIds: ['60d5ec9d2b5b82a5d5000001'],
      firstOrder: true
    },
    required: false,
  })
  @IsOptional()
  conditions?: Record<string, any>;
}
