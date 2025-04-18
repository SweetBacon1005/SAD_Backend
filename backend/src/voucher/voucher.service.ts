import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';
import { DiscountType, VoucherApplicable } from '@prisma/client';

@Injectable()
export class VoucherService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVoucherDto: CreateVoucherDto): Promise<VoucherResponseDto> {
    const { 
      code, 
      name, 
      description, 
      discountType, 
      discountValue, 
      minOrderValue = 0, 
      maxDiscount, 
      startDate, 
      endDate,
      isActive = true,
      usageLimit,
      applicableFor = VoucherApplicable.ALL,
      conditions 
    } = createVoucherDto;

    // Kiểm tra mã voucher đã tồn tại chưa
    const existingVoucher = await this.prisma.voucher.findUnique({
      where: { code },
    });

    if (existingVoucher) {
      throw new BadRequestException(`Voucher với mã ${code} đã tồn tại`);
    }

    // Kiểm tra giá trị giảm giá
    if (discountType === DiscountType.PERCENTAGE && discountValue > 100) {
      throw new BadRequestException('Giá trị giảm giá theo % không thể vượt quá 100%');
    }

    // Kiểm tra ngày bắt đầu và kết thúc
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj > endDateObj) {
      throw new BadRequestException('Ngày bắt đầu không thể sau ngày kết thúc');
    }

    // Tạo voucher mới
    const voucher = await this.prisma.voucher.create({
      data: {
        code,
        name,
        description,
        discountType,
        discountValue,
        minOrderValue,
        maxDiscount,
        startDate: startDateObj,
        endDate: endDateObj,
        isActive,
        usageLimit,
        usageCount: 0,
        applicableFor,
        conditions,
      },
    });

    return {
      ...voucher,
      conditions: voucher.conditions as Record<string, any> | null,
    };
  }

  async findAll(isActive?: boolean): Promise<VoucherResponseDto[]> {
    let where = {};
    
    if (isActive !== undefined) {
      where = { isActive };
    }
    
    const vouchers = await this.prisma.voucher.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return vouchers.map(voucher => ({
      ...voucher,
      conditions: voucher.conditions as Record<string, any> | null,
    }));
  }

  async findOne(id: string): Promise<VoucherResponseDto> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
    });
    
    if (!voucher) {
      throw new NotFoundException(`Voucher với ID ${id} không tồn tại`);
    }
    
    return {
      ...voucher,
      conditions: voucher.conditions as Record<string, any> | null,
    };
  }

  async findByCode(code: string): Promise<VoucherResponseDto> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
    });
    
    if (!voucher) {
      throw new NotFoundException(`Voucher với mã ${code} không tồn tại`);
    }
    
    return {
      ...voucher,
      conditions: voucher.conditions as Record<string, any> | null,
    };
  }

  async update(id: string, updateVoucherDto: UpdateVoucherDto): Promise<VoucherResponseDto> {
    // Kiểm tra voucher tồn tại
    const existingVoucher = await this.prisma.voucher.findUnique({
      where: { id },
    });
    
    if (!existingVoucher) {
      throw new NotFoundException(`Voucher với ID ${id} không tồn tại`);
    }
    
    // Kiểm tra mã voucher nếu thay đổi
    if (updateVoucherDto.code && updateVoucherDto.code !== existingVoucher.code) {
      const codeExists = await this.prisma.voucher.findFirst({
        where: {
          code: updateVoucherDto.code,
          id: { not: id },
        },
      });
      
      if (codeExists) {
        throw new BadRequestException(`Voucher với mã ${updateVoucherDto.code} đã tồn tại`);
      }
    }
    
    // Kiểm tra giá trị giảm giá nếu thay đổi
    if (
      updateVoucherDto.discountType === DiscountType.PERCENTAGE &&
      updateVoucherDto.discountValue &&
      updateVoucherDto.discountValue > 100
    ) {
      throw new BadRequestException('Giá trị giảm giá theo % không thể vượt quá 100%');
    }
    
    // Kiểm tra ngày bắt đầu và kết thúc nếu thay đổi
    let startDateObj = existingVoucher.startDate;
    let endDateObj = existingVoucher.endDate;
    
    if (updateVoucherDto.startDate) {
      startDateObj = new Date(updateVoucherDto.startDate);
    }
    
    if (updateVoucherDto.endDate) {
      endDateObj = new Date(updateVoucherDto.endDate);
    }
    
    if (startDateObj > endDateObj) {
      throw new BadRequestException('Ngày bắt đầu không thể sau ngày kết thúc');
    }
    
    // Cập nhật voucher
    const updatedVoucher = await this.prisma.voucher.update({
      where: { id },
      data: {
        code: updateVoucherDto.code,
        name: updateVoucherDto.name,
        description: updateVoucherDto.description,
        discountType: updateVoucherDto.discountType,
        discountValue: updateVoucherDto.discountValue,
        minOrderValue: updateVoucherDto.minOrderValue,
        maxDiscount: updateVoucherDto.maxDiscount,
        startDate: updateVoucherDto.startDate ? startDateObj : undefined,
        endDate: updateVoucherDto.endDate ? endDateObj : undefined,
        isActive: updateVoucherDto.isActive,
        usageLimit: updateVoucherDto.usageLimit,
        applicableFor: updateVoucherDto.applicableFor,
        conditions: updateVoucherDto.conditions,
      },
    });
    
    return {
      ...updatedVoucher,
      conditions: updatedVoucher.conditions as Record<string, any> | null,
    };
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    // Kiểm tra voucher tồn tại
    const existingVoucher = await this.prisma.voucher.findUnique({
      where: { id },
    });
    
    if (!existingVoucher) {
      throw new NotFoundException(`Voucher với ID ${id} không tồn tại`);
    }
    
    // Xóa voucher
    await this.prisma.voucher.delete({
      where: { id },
    });
    
    return { success: true, message: 'Voucher đã được xóa thành công' };
  }

  async validateVoucher(
    code: string,
    orderTotal: number,
    userId?: string,
    productIds?: string[],
  ): Promise<{
    valid: boolean;
    voucher?: VoucherResponseDto;
    discountAmount?: number;
    message?: string;
  }> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { code },
      });

      if (!voucher) {
        return { valid: false, message: 'Mã voucher không tồn tại' };
      }

      // Kiểm tra trạng thái kích hoạt
      if (!voucher.isActive) {
        return { valid: false, message: 'Voucher không còn hiệu lực' };
      }

      // Kiểm tra thời gian hiệu lực
      const now = new Date();
      if (now < voucher.startDate || now > voucher.endDate) {
        return { valid: false, message: 'Voucher không nằm trong thời gian hiệu lực' };
      }

      // Kiểm tra giới hạn sử dụng
      if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
        return { valid: false, message: 'Voucher đã hết lượt sử dụng' };
      }

      // Kiểm tra giá trị đơn hàng tối thiểu
      if (orderTotal < voucher.minOrderValue) {
        return {
          valid: false,
          message: `Giá trị đơn hàng tối thiểu phải là ${voucher.minOrderValue} VNĐ`,
        };
      }

      // Kiểm tra điều kiện áp dụng
      if (voucher.applicableFor !== VoucherApplicable.ALL && voucher.conditions) {
        // Kiểm tra theo danh mục sản phẩm
        if (
          voucher.applicableFor === VoucherApplicable.SPECIFIC_CATEGORIES &&
          (!productIds || productIds.length === 0)
        ) {
          return {
            valid: false,
            message: 'Voucher chỉ áp dụng cho các danh mục sản phẩm cụ thể',
          };
        }

        // Kiểm tra theo sản phẩm cụ thể
        if (
          voucher.applicableFor === VoucherApplicable.SPECIFIC_PRODUCTS &&
          (!productIds || productIds.length === 0)
        ) {
          return {
            valid: false,
            message: 'Voucher chỉ áp dụng cho các sản phẩm cụ thể',
          };
        }

        // Kiểm tra theo người dùng
        if (
          voucher.applicableFor === VoucherApplicable.SPECIFIC_USERS &&
          (!userId || !(voucher.conditions as Record<string, any>).userIds?.includes(userId))
        ) {
          return {
            valid: false,
            message: 'Voucher chỉ áp dụng cho những người dùng cụ thể',
          };
        }

        // Kiểm tra đơn hàng đầu tiên
        if (voucher.applicableFor === VoucherApplicable.FIRST_ORDER && userId) {
          const orderCount = await this.prisma.order.count({
            where: {
              userId,
            },
          });

          if (orderCount > 0) {
            return {
              valid: false,
              message: 'Voucher chỉ áp dụng cho đơn hàng đầu tiên',
            };
          }
        }
      }

      // Tính toán số tiền giảm giá
      let discountAmount = 0;
      if (voucher.discountType === DiscountType.PERCENTAGE) {
        discountAmount = (orderTotal * voucher.discountValue) / 100;
        if (voucher.maxDiscount !== null && discountAmount > voucher.maxDiscount) {
          discountAmount = voucher.maxDiscount;
        }
      } else {
        discountAmount = voucher.discountValue;
        if (discountAmount > orderTotal) {
          discountAmount = orderTotal;
        }
      }

      return {
        valid: true,
        voucher: {
          ...voucher,
          conditions: voucher.conditions as Record<string, any> | null,
        },
        discountAmount,
        message: 'Voucher hợp lệ',
      };
    } catch (error) {
      return { valid: false, message: 'Lỗi khi xác thực voucher' };
    }
  }

  async incrementUsageCount(code: string): Promise<VoucherResponseDto> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher với mã ${code} không tồn tại`);
    }

    const updatedVoucher = await this.prisma.voucher.update({
      where: { code },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return {
      ...updatedVoucher,
      conditions: updatedVoucher.conditions as Record<string, any> | null,
    };
  }

  // Phương thức gán voucher cho user
  async assignVoucherToUser(userId: string, voucherId: string, expiresAt?: string): Promise<any> {
    // Kiểm tra user tồn tại
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Người dùng với ID ${userId} không tồn tại`);
    }

    // Kiểm tra voucher tồn tại và còn hiệu lực
    const voucher = await this.prisma.voucher.findUnique({
      where: { 
        id: voucherId,
        isActive: true,
      },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher với ID ${voucherId} không tồn tại hoặc không còn hiệu lực`);
    }

    // Kiểm tra user đã có voucher này chưa
    const existingUserVoucher = await this.prisma.userVoucher.findFirst({
      where: {
        userId,
        voucherId,
        isUsed: false,
      },
    });

    if (existingUserVoucher) {
      throw new BadRequestException('Người dùng đã có voucher này');
    }

    // Đặt thời gian hết hạn mặc định là thời gian hết hạn của voucher nếu không được chỉ định
    let expiryDate = voucher.endDate;
    if (expiresAt) {
      expiryDate = new Date(expiresAt);
      // Kiểm tra thời gian hết hạn không vượt quá thời gian hết hạn của voucher
      if (expiryDate > voucher.endDate) {
        expiryDate = voucher.endDate;
      }
    }

    // Tạo user voucher mới
    const userVoucher = await this.prisma.userVoucher.create({
      data: {
        userId,
        voucherId,
        isUsed: false,
        expiresAt: expiryDate,
      },
      include: {
        voucher: true,
      },
    });

    return userVoucher;
  }

  // Phương thức lấy tất cả voucher của một user
  async getUserVouchers(userId: string, onlyValid: boolean = false): Promise<any[]> {
    // Kiểm tra user tồn tại
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Người dùng với ID ${userId} không tồn tại`);
    }

    let whereCondition: any = {
      userId,
    };

    // Nếu chỉ lấy voucher còn hiệu lực
    if (onlyValid) {
      const now = new Date();
      whereCondition = {
        ...whereCondition,
        isUsed: false,
        expiresAt: {
          gte: now,
        },
        voucher: {
          isActive: true,
          endDate: {
            gte: now,
          },
        },
      };
    }

    // Lấy voucher của user
    const userVouchers = await this.prisma.userVoucher.findMany({
      where: whereCondition,
      include: {
        voucher: true,
      },
      orderBy: {
        obtainedAt: 'desc',
      },
    });

    return userVouchers;
  }

  // Phương thức đánh dấu một voucher của user đã được sử dụng
  async markVoucherAsUsed(userVoucherId: string): Promise<any> {
    // Kiểm tra user voucher tồn tại
    const userVoucher = await this.prisma.userVoucher.findUnique({
      where: { id: userVoucherId },
      include: {
        voucher: true,
      },
    });

    if (!userVoucher) {
      throw new NotFoundException(`User voucher với ID ${userVoucherId} không tồn tại`);
    }

    if (userVoucher.isUsed) {
      throw new BadRequestException('Voucher này đã được sử dụng');
    }

    // Kiểm tra voucher còn hiệu lực
    const now = new Date();
    if (userVoucher.expiresAt && userVoucher.expiresAt < now) {
      throw new BadRequestException('Voucher đã hết hạn');
    }

    if (!userVoucher.voucher.isActive || userVoucher.voucher.endDate < now) {
      throw new BadRequestException('Voucher không còn hiệu lực');
    }

    // Cập nhật trạng thái sử dụng
    const updatedUserVoucher = await this.prisma.userVoucher.update({
      where: { id: userVoucherId },
      data: {
        isUsed: true,
        usedAt: now,
      },
      include: {
        voucher: true,
      },
    });

    // Tăng số lần sử dụng của voucher
    await this.incrementUsageCount(userVoucher.voucher.code);

    return updatedUserVoucher;
  }

  // Phương thức đếm số lượng voucher của một user
  async countUserVouchers(userId: string, onlyValid: boolean = false): Promise<number> {
    // Kiểm tra user tồn tại
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Người dùng với ID ${userId} không tồn tại`);
    }

    let whereCondition: any = {
      userId,
    };

    // Nếu chỉ đếm voucher còn hiệu lực
    if (onlyValid) {
      const now = new Date();
      whereCondition = {
        ...whereCondition,
        isUsed: false,
        expiresAt: {
          gte: now,
        },
        voucher: {
          isActive: true,
          endDate: {
            gte: now,
          },
        },
      };
    }

    // Đếm voucher của user
    const count = await this.prisma.userVoucher.count({
      where: whereCondition,
    });

    return count;
  }

  // Phương thức kiểm tra voucher có thuộc về người dùng không
  async verifyVoucherOwnership(userVoucherId: string, userId: string): Promise<boolean> {
    const userVoucher = await this.prisma.userVoucher.findUnique({
      where: { id: userVoucherId },
    });

    if (!userVoucher) {
      throw new NotFoundException(`UserVoucher với ID ${userVoucherId} không tồn tại`);
    }

    if (userVoucher.userId !== userId) {
      throw new BadRequestException('Không có quyền sử dụng voucher này');
    }

    return true;
  }
} 