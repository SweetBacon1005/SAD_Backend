import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import {
  WishlistFilterDto,
  WishlistListResponseDto,
} from './dto/pagination-wishlist.dto';
import {
  WishlistItemResponseDto,
  WishlistResponseDto,
} from './dto/wishlist-response.dto';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
  ): Promise<WishlistResponseDto> {
    const existingWishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (existingWishlist) {
      return this.mapToWishlistResponseDto(existingWishlist);
    }

    const wishlist = await this.prisma.wishlist.create({
      data: {
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return this.mapToWishlistResponseDto(wishlist);
  }

  async findAll(
    userId: string,
    filter: WishlistFilterDto = {},
  ): Promise<WishlistListResponseDto> {
    let wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: true,
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
    });

    if (!wishlist) {
      wishlist = await this.prisma.wishlist.create({
        data: {
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              product: true,
            },
            orderBy: {
              addedAt: 'desc',
            },
          },
        },
      });
    }

    return {
      data: [this.mapToResponseDto(wishlist)],
      currentPage: 1,
      totalPages: 1,
      total: 1,
      timestamp: new Date().toISOString(),
    };
  }

  async findOne(id: string, userId: string): Promise<WishlistResponseDto> {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: true,
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
    });

    if (!wishlist) {
      throw new NotFoundException('Không tìm thấy danh sách yêu thích');
    }

    if (wishlist.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền xem danh sách yêu thích này',
      );
    }

    return this.mapToResponseDto(wishlist);
  }

  async addItem(
    wishlistId: string,
    userId: string,
    addItemDto: AddWishlistItemDto,
  ): Promise<WishlistResponseDto> {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
    });

    if (!wishlist) {
      throw new NotFoundException('Danh sách yêu thích không tồn tại');
    }

    if (wishlist.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền thêm sản phẩm vào danh sách này',
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id: addItemDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    const existingItem = await this.prisma.wishlistItem.findFirst({
      where: {
        wishlistId,
        productId: addItemDto.productId,
      },
    });

    if (existingItem) {
      throw new ConflictException(
        'Sản phẩm đã tồn tại trong danh sách yêu thích',
      );
    }

    await this.prisma.wishlistItem.create({
      data: {
        wishlistId,
        productId: addItemDto.productId,
        note: addItemDto.note,
      },
    });

    return this.findOne(wishlistId, userId);
  }

  async removeItem(
    wishlistId: string,
    userId: string,
    productId: string,
  ): Promise<WishlistResponseDto> {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
    });

    if (!wishlist) {
      throw new NotFoundException('Danh sách yêu thích không tồn tại');
    }

    if (wishlist.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa sản phẩm khỏi danh sách này',
      );
    }

    const item = await this.prisma.wishlistItem.findFirst({
      where: {
        wishlistId,
        productId,
      },
    });

    if (!item) {
      throw new NotFoundException('Sản phẩm không tồn tại trong danh sách');
    }

    await this.prisma.wishlistItem.delete({
      where: { id: item.id },
    });

    return this.findOne(wishlistId, userId);
  }

  async clearItems(
    wishlistId: string,
    userId: string,
  ): Promise<WishlistResponseDto> {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
    });

    if (!wishlist) {
      throw new NotFoundException('Danh sách yêu thích không tồn tại');
    }

    if (wishlist.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa sản phẩm khỏi danh sách này',
      );
    }

    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId },
    });

    return this.findOne(wishlistId, userId);
  }

  private mapToWishlistResponseDto(wishlist: any): WishlistResponseDto {
    return {
      id: wishlist.id,
      user: {
        id: wishlist.user?.id || '',
        name: wishlist.user?.name || '',
      },
      items: wishlist.items
        ? wishlist.items.map((item) => this.mapToWishlistItemResponseDto(item))
        : [],
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
    };
  }

  private mapToWishlistItemResponseDto(item: any): WishlistItemResponseDto {
    return {
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.basePrice,
        image:
          item.product.images && item.product.images.length > 0
            ? item.product.images[0]
            : null,
      },
      note: item.note,
      addedAt: item.addedAt,
    };
  }

  private mapToResponseDto(wishlist: any): WishlistResponseDto {
    return {
      id: wishlist.id,
      user: wishlist.user,
      items:
        wishlist.items?.map((item) => ({
          id: item.id,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.basePrice,
            image:
              item.product.images?.length > 0 ? item.product.images[0] : null,
          },
          note: item.note,
          addedAt: item.addedAt,
        })) || [],
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
    };
  }
} 