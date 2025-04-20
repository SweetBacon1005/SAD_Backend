import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Voucher } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { ValidateVoucherResponseDto } from './dto/validate-voucher-response.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';

@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createVoucherDto: CreateVoucherDto,
  ): Promise<VoucherResponseDto> {
    const existingVoucher = await this.prisma.voucher.findUnique({
      where: { code: createVoucherDto.code },
    });

    if (existingVoucher) {
      throw new ConflictException(
        `Voucher with code ${createVoucherDto.code} already exists`,
      );
    }

    const voucher = await this.prisma.voucher.create({
      data: {
        code: createVoucherDto.code,
        name: createVoucherDto.name,
        discountType: createVoucherDto.discountType,
        description: createVoucherDto.description,
        discountValue: createVoucherDto.discountValue,
        minOrderValue: createVoucherDto.minOrderValue || 0,
        maxDiscount: createVoucherDto.maxDiscount,
        startDate: createVoucherDto.startDate,
        endDate: createVoucherDto.endDate,
        isActive: createVoucherDto.isActive ?? true,
        usageLimit: createVoucherDto.usageLimit,
        usageCount: 0,
        conditions: createVoucherDto.conditions,
        applicableFor: createVoucherDto.applicableFor,
      },
    });

    return this.mapVoucherToDto(voucher);
  }

  async findAll(isActive?: boolean): Promise<VoucherResponseDto[]> {
    const where = isActive !== undefined ? { isActive } : {};

    const vouchers = await this.prisma.voucher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return vouchers.map((voucher) => this.mapVoucherToDto(voucher));
  }

  async findOne(id: string): Promise<VoucherResponseDto> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    return this.mapVoucherToDto(voucher);
  }

  async findByCode(code: string): Promise<VoucherResponseDto> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with code ${code} not found`);
    }

    return this.mapVoucherToDto(voucher);
  }

  async update(
    id: string,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<VoucherResponseDto> {
    const existingVoucher = await this.prisma.voucher.findUnique({
      where: { id },
    });

    if (!existingVoucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    if (
      updateVoucherDto.code &&
      updateVoucherDto.code !== existingVoucher.code
    ) {
      const duplicateCode = await this.prisma.voucher.findUnique({
        where: { code: updateVoucherDto.code },
      });

      if (duplicateCode) {
        throw new ConflictException(
          `Voucher with code ${updateVoucherDto.code} already exists`,
        );
      }
    }

    const voucher = await this.prisma.voucher.update({
      where: { id },
      data: {
        code: updateVoucherDto.code,
        name: updateVoucherDto.name,
        discountType: updateVoucherDto.discountType,
        description: updateVoucherDto.description,
        discountValue: updateVoucherDto.discountValue,
        minOrderValue: updateVoucherDto.minOrderValue,
        maxDiscount: updateVoucherDto.maxDiscount,
        startDate: updateVoucherDto.startDate,
        endDate: updateVoucherDto.endDate,
        isActive: updateVoucherDto.isActive,
        usageLimit: updateVoucherDto.usageLimit,
        conditions: updateVoucherDto.conditions,
        applicableFor: updateVoucherDto.applicableFor,
      },
    });

    return this.mapVoucherToDto(voucher);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const existingVoucher = await this.prisma.voucher.findUnique({
      where: { id },
    });

    if (!existingVoucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    await this.prisma.voucher.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Voucher with ID ${id} has been successfully deleted`,
    };
  }

  async getPublicVouchers(): Promise<VoucherResponseDto[]> {
    const currentDate = new Date();
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: { lte: currentDate },
        endDate: { gte: currentDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    const availableVouchers = vouchers.filter(
      (voucher) =>
        voucher.usageLimit === null || voucher.usageCount < voucher.usageLimit,
    );

    return availableVouchers.map((voucher) => this.mapVoucherToDto(voucher));
  }

  async validateVoucher(
    voucherCode: string,
    orderTotal: number,
    userId?: string,
    productIds?: string[],
  ): Promise<ValidateVoucherResponseDto> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { code: voucherCode },
      });

      if (!voucher) {
        return {
          isValid: false,
          message: 'Voucher không tồn tại',
          voucher: null,
        };
      }

      if (!voucher.isActive) {
        return {
          isValid: false,
          message: 'Voucher đã bị vô hiệu hóa',
          voucher: null,
        };
      }

      const currentDate = new Date();
      if (
        (voucher.startDate && currentDate < voucher.startDate) ||
        (voucher.endDate && currentDate > voucher.endDate)
      ) {
        return {
          isValid: false,
          message: 'Voucher không trong thời gian hiệu lực',
          voucher: null,
        };
      }

      if (
        voucher.usageLimit !== null &&
        voucher.usageLimit !== undefined &&
        voucher.usageCount >= voucher.usageLimit
      ) {
        return {
          isValid: false,
          message: 'Voucher đã đạt giới hạn sử dụng',
          voucher: null,
        };
      }

      if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) {
        return {
          isValid: false,
          message: `Giá trị đơn hàng tối thiểu để sử dụng voucher là ${voucher.minOrderValue}`,
          voucher: null,
        };
      }

      if (
        voucher.conditions &&
        typeof voucher.conditions === 'object' &&
        'productIds' in voucher.conditions &&
        Array.isArray((voucher.conditions as Record<string, any>).productIds) &&
        (voucher.conditions as Record<string, any>).productIds.length > 0 &&
        productIds &&
        productIds.length > 0
      ) {
        const hasRequiredProduct = productIds.some((id) =>
          (voucher.conditions as Record<string, any>).productIds.includes(id),
        );

        if (!hasRequiredProduct) {
          return {
            isValid: false,
            message:
              'Voucher chỉ áp dụng cho một số sản phẩm nhất định không có trong đơn hàng',
            voucher: null,
          };
        }
      }

      let discountAmount = 0;
      if (voucher.discountType === 'PERCENTAGE') {
        discountAmount = (orderTotal * voucher.discountValue) / 100;
        if (
          voucher.maxDiscount !== null &&
          voucher.maxDiscount !== undefined &&
          discountAmount > voucher.maxDiscount
        ) {
          discountAmount = voucher.maxDiscount;
        }
      } else {
        discountAmount = Math.min(voucher.discountValue, orderTotal);
      }

      return {
        isValid: true,
        message: 'Voucher hợp lệ',
        voucher: this.mapVoucherToDto(voucher),
        discountAmount,
      };
    } catch (error) {
      this.logger.error(
        `Error validating voucher: ${error.message}`,
        error.stack,
      );
      return {
        isValid: false,
        message: 'Lỗi khi kiểm tra voucher',
        voucher: null,
      };
    }
  }

  async increaseVoucherUsage(voucherId: string): Promise<void> {
    if (!voucherId) return;

    try {
      await this.prisma.voucher.update({
        where: { id: voucherId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error incrementing voucher usage for voucher ${voucherId}: ${error.message}`,
        error.stack,
      );
    }
  }

  async incrementUsageCount(code: string): Promise<void> {
    if (!code) return;

    try {
      await this.prisma.voucher.update({
        where: { code },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error incrementing voucher usage for voucher code ${code}: ${error.message}`,
        error.stack,
      );
    }
  }

  private mapVoucherToDto(voucher: Voucher): VoucherResponseDto {
    return {
      id: voucher.id,
      code: voucher.code,
      name: voucher.name,
      discountType: voucher.discountType,
      description: voucher.description,
      discountValue: voucher.discountValue,
      minOrderValue: voucher.minOrderValue,
      maxDiscount: voucher.maxDiscount,
      startDate: voucher.startDate,
      endDate: voucher.endDate,
      isActive: voucher.isActive,
      usageLimit: voucher.usageLimit,
      usageCount: voucher.usageCount,
      createdAt: voucher.createdAt,
      updatedAt: voucher.updatedAt,
      conditions: voucher.conditions as Record<string, any> | null,
      applicableFor: voucher.applicableFor,
    };
  }
}
