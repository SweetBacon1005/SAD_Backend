import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { DiscountType, VoucherApplicable } from '@prisma/client';

export class UpdateVoucherDto {
  @ApiProperty({
    description: 'Mã voucher',
    example: 'SUMMER2023',
    required: false,
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'Tên voucher',
    example: 'Khuyến mãi mùa hè 2023',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

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
    required: false,
  })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiProperty({
    description: 'Giá trị giảm giá (% hoặc số tiền cố định)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(100, { message: 'Giá trị giảm giá theo % không thể vượt quá 100%' })
  discountValue?: number;

  @ApiProperty({
    description: 'Giá trị đơn hàng tối thiểu để áp dụng voucher',
    example: 100000,
    required: false,
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
    example: '2023-06-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Ngày kết thúc hiệu lực',
    example: '2023-08-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Trạng thái kích hoạt',
    example: true,
    required: false,
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
    required: false,
  })
  @IsOptional()
  @IsEnum(VoucherApplicable)
  applicableFor?: VoucherApplicable;

  @ApiProperty({
    description: 'Điều kiện áp dụng (category IDs, product IDs, user IDs...)',
    example: {
      categoryIds: ['60d5ec9d2b5b82a5d5000001', '60d5ec9d2b5b82a5d5000002'],
      productIds: ['60d5ec9d2b5b82a5d5000003'],
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;
} 