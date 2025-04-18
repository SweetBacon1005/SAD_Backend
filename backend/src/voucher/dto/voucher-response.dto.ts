import { ApiProperty } from '@nestjs/swagger';
import { DiscountType, VoucherApplicable } from '@prisma/client';

export class VoucherResponseDto {
  @ApiProperty({
    description: 'ID voucher',
    example: '60d5ec9d2b5b82a5d5000001',
  })
  id: string;

  @ApiProperty({
    description: 'Mã voucher',
    example: 'SUMMER2023',
  })
  code: string;

  @ApiProperty({
    description: 'Tên voucher',
    example: 'Khuyến mãi mùa hè 2023',
  })
  name: string;

  @ApiProperty({
    description: 'Mô tả voucher',
    example: 'Giảm giá 10% cho tất cả sản phẩm trong mùa hè 2023',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Loại giảm giá',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  discountType: DiscountType;

  @ApiProperty({
    description: 'Giá trị giảm giá (% hoặc số tiền cố định)',
    example: 10,
  })
  discountValue: number;

  @ApiProperty({
    description: 'Giá trị đơn hàng tối thiểu để áp dụng voucher',
    example: 100000,
  })
  minOrderValue: number;

  @ApiProperty({
    description: 'Giá trị giảm giá tối đa',
    example: 50000,
    nullable: true,
  })
  maxDiscount: number | null;

  @ApiProperty({
    description: 'Ngày bắt đầu hiệu lực',
    example: '2023-06-01T00:00:00Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'Ngày kết thúc hiệu lực',
    example: '2023-08-31T23:59:59Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Trạng thái kích hoạt',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Giới hạn số lần sử dụng',
    example: 100,
    nullable: true,
  })
  usageLimit: number | null;

  @ApiProperty({
    description: 'Số lần đã sử dụng',
    example: 45,
  })
  usageCount: number;

  @ApiProperty({
    description: 'Đối tượng áp dụng',
    enum: VoucherApplicable,
    example: VoucherApplicable.ALL,
  })
  applicableFor: VoucherApplicable;

  @ApiProperty({
    description: 'Điều kiện áp dụng (category IDs, product IDs, user IDs...)',
    example: {
      categoryIds: ['60d5ec9d2b5b82a5d5000001', '60d5ec9d2b5b82a5d5000002'],
      productIds: ['60d5ec9d2b5b82a5d5000003'],
    },
    nullable: true,
  })
  conditions: Record<string, any> | null;

  @ApiProperty({
    description: 'Thời gian tạo',
    example: '2023-06-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật',
    example: '2023-06-02T00:00:00Z',
    nullable: true,
  })
  updatedAt: Date | null;
} 