import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { WishlistResponseDto, WishlistItemResponseDto } from './dto/wishlist-response.dto';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createWishlistDto: CreateWishlistDto): Promise<WishlistResponseDto> {
    const wishlist = await this.prisma.wishlist.create({
      data: {
        userId,
        name: createWishlistDto.name,
        description: createWishlistDto.description,
        isPublic: createWishlistDto.isPublic || false,
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

  async findAll(userId: string): Promise<WishlistResponseDto[]> {
    const wishlists = await this.prisma.wishlist.findMany({
      where: {
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

    return wishlists.map(wishlist => this.mapToWishlistResponseDto(wishlist));
  }

  async findPublic(): Promise<WishlistResponseDto[]> {
    const wishlists = await this.prisma.wishlist.findMany({
      where: {
        isPublic: true,
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

    return wishlists.map(wishlist => this.mapToWishlistResponseDto(wishlist));
  }

  async findOne(id: string, userId?: string): Promise<WishlistResponseDto> {
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

    if (!wishlist) {
      throw new NotFoundException('Danh sách yêu thích không tồn tại');
    }

    // Kiểm tra quyền truy cập nếu danh sách không công khai
    if (!wishlist.isPublic && userId !== wishlist.userId) {
      throw new ForbiddenException('Bạn không có quyền xem danh sách yêu thích này');
    }

    return this.mapToWishlistResponseDto(wishlist);
  }

  async update(id: string, userId: string, updateWishlistDto: UpdateWishlistDto): Promise<WishlistResponseDto> {
    // Kiểm tra danh sách tồn tại và thuộc về người dùng
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id } });
    
    if (!wishlist) {
      throw new NotFoundException('Danh sách yêu thích không tồn tại');
    }

    if (wishlist.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật danh sách này');
    }

    // Cập nhật danh sách
    const updatedWishlist = await this.prisma.wishlist.update({
      where: { id },
      data: {
        name: updateWishlistDto.name,
        description: updateWishlistDto.description,
        isPublic: updateWishlistDto.isPublic,
        updatedAt: new Date(),
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

    return this.mapToWishlistResponseDto(updatedWishlist);
  }

  async remove(id: string, userId: string): Promise<void> {
    // Kiểm tra danh sách tồn tại và thuộc về người dùng
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id } });
    
    if (!wishlist) {
      throw new NotFoundException('Danh sách yêu thích không tồn tại');
    }

    if (wishlist.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa danh sách này');
    }

    await this.prisma.wishlist.delete({ where: { id } });
  }

  async addItem(wishlistId: string, userId: string, addItemDto: AddWishlistItemDto): Promise<WishlistResponseDto> {
    // Kiểm tra danh sách tồn tại và thuộc về người dùng
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id: wishlistId } });
    
    if (!wishlist) {
      throw new NotFoundException('Danh sách yêu thích không tồn tại');
    }

    if (wishlist.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thêm sản phẩm vào danh sách này');
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await this.prisma.product.findUnique({
      where: { id: addItemDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Kiểm tra sản phẩm đã tồn tại trong danh sách chưa
    const existingItem = await this.prisma.wishlistItem.findFirst({
      where: {
        wishlistId,
        productId: addItemDto.productId,
      },
    });

    if (existingItem) {
      throw new ConflictException('Sản phẩm đã tồn tại trong danh sách yêu thích');
    }

    // Thêm sản phẩm vào danh sách
    await this.prisma.wishlistItem.create({
      data: {
        wishlistId,
        productId: addItemDto.productId,
        note: addItemDto.note,
      },
    });

    // Trả về danh sách đã cập nhật
    return this.findOne(wishlistId, userId);
  }

  async removeItem(wishlistId: string, itemId: string, userId: string): Promise<WishlistResponseDto> {
    // Kiểm tra danh sách tồn tại và thuộc về người dùng
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id: wishlistId } });
    
    if (!wishlist) {
      throw new NotFoundException('Danh sách yêu thích không tồn tại');
    }

    if (wishlist.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa sản phẩm khỏi danh sách này');
    }

    // Kiểm tra item tồn tại và thuộc về wishlist
    const item = await this.prisma.wishlistItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.wishlistId !== wishlistId) {
      throw new NotFoundException('Sản phẩm không tồn tại trong danh sách');
    }

    // Xóa item
    await this.prisma.wishlistItem.delete({
      where: { id: itemId },
    });

    // Trả về danh sách đã cập nhật
    return this.findOne(wishlistId, userId);
  }

  // Helper method để map từ Prisma model sang DTO
  private mapToWishlistResponseDto(wishlist: any): WishlistResponseDto {
    return {
      id: wishlist.id,
      name: wishlist.name,
      description: wishlist.description,
      isPublic: wishlist.isPublic,
      user: wishlist.user ? {
        id: wishlist.user.id,
        name: wishlist.user.name,
      } : undefined,
      items: wishlist.items ? wishlist.items.map(item => this.mapToWishlistItemResponseDto(item)) : [],
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
        image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : null,
      },
      note: item.note,
      addedAt: item.addedAt,
    };
  }
} 