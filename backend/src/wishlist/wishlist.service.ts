import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddWishlistItemDto } from './dto/add-wishlist.dto';
import { WishlistFilterDto } from './dto/pagination-wishlist.dto';
import { WishlistResponseDto } from './dto/wishlist-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlistByUserId(userId: string): Promise<any> {
    const wishlist = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return wishlist.map(this.mapToWishlistResponseDto);
  }

  async search(
    userId: string,
    filter: WishlistFilterDto = {},
  ): Promise<any> {
    const currentPage = Number(filter.currentPage) || 1;
    const pageSize = Number(filter.pageSize) || 10;
    const skip = (currentPage - 1) * pageSize;

    const query = filter.query?.trim();
    const categoryId = filter.categoryId;
    const sortBy = filter.sortBy ?? 'createdAt';
    const sortOrder = filter.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const minPrice = filter.minPrice;
    const maxPrice = filter.maxPrice;
  
    if (minPrice && maxPrice && minPrice > maxPrice) {
      throw new BadRequestException(
        'Giá tối thiểu không được lớn hơn giá tối đa',
      );
    }
  
    const productWhere: Prisma.ProductWhereInput = {};
  
    if (query) {
      productWhere.name = { contains: query, mode: 'insensitive' };
    }
  
    if (categoryId) {
      productWhere.categoryId = categoryId;
    }
  
    if (minPrice || maxPrice) {
      productWhere.basePrice = {};
      if (minPrice) productWhere.basePrice.gte = minPrice;
      if (maxPrice) productWhere.basePrice.lte = maxPrice;
    }
  
    // Tìm các sản phẩm phù hợp filter
    const matchingProducts = await this.prisma.product.findMany({
      where: productWhere,
      select: { id: true },
    });
  
    const productIds = matchingProducts.map(p => p.id);

    const [total, wishlist] = await Promise.all([
      await this.prisma.wishlist.count({
        where: {
          userId,
          productId: { in: productIds },
        },
      }),
      await this.prisma.wishlist.findMany({
        where: {
          userId,
          productId: { in: productIds },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy: sortBy === 'price'
        ? { product: { basePrice: sortOrder } }
        : { createdAt: sortOrder },
        skip: skip,
        take: pageSize,
      })
    ]);

    return {
      total: total,
      currentPage: currentPage,
      totalPage: Math.ceil(total / pageSize),
      data: wishlist.map(this.mapToWishlistResponseDto)
    };
  }
  

  async addItem( userId: string, addItemDto: AddWishlistItemDto): Promise<any> {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId: userId, productId: addItemDto.productId },
    });
    
    if (wishlist) {
      throw new ConflictException('Sản phẩm đã tồn tại trong danh sách yêu thích');
    }

    const newWishlistItem = await this.prisma.wishlist.create({
      data: {
        userId: userId,
        productId: addItemDto.productId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            images: true,
          },
        },
      },
    });

    return this.mapToWishlistResponseDto(newWishlistItem);
  }

  async removeItem(userId: string, productId: string): Promise<any> {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId: userId, productId: productId },
    });

    if (!wishlist) {
      throw new NotFoundException('Danh sách yêu thích không tồn tại');
    }

    await this.prisma.wishlist.delete({
      where: { id: wishlist.id },
    });

    return null;
  }

  async clearItems(userId: string): Promise<any> {
    await this.prisma.wishlist.deleteMany({
      where: { userId },
    });

    return null;
  }

  private mapToWishlistResponseDto(wishlist: any): WishlistResponseDto {
    return {
      id: wishlist.id,
      user: {
        id: wishlist.user?.id || '',
        name: wishlist.user?.name || '',
      },
      product: {
        id: wishlist.product?.id,
        name: wishlist.product?.name,
        basePrice: wishlist.product?.basePrice,
        images: wishlist.product?.images
      },
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
    };
  }
}
