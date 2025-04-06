import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import {
  SortOrder,
  WishlistDetailResponseDto,
  WishlistFilterDto,
  WishlistItemFilterDto,
  WishlistListResponseDto,
  WishlistSortField,
} from './dto/pagination-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import {
  WishlistItemResponseDto,
  WishlistResponseDto,
} from './dto/wishlist-response.dto';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createWishlistDto: CreateWishlistDto,
  ): Promise<WishlistResponseDto> {
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

  async findAll(
    userId: string,
    filter: WishlistFilterDto = {},
  ): Promise<WishlistListResponseDto> {
    const {
      search,
      sortBy = WishlistSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
      currentPage = 1,
      pageSize = 10,
    } = filter;

    // Xây dựng điều kiện where
    const where: any = { userId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Thực hiện truy vấn với phân trang
    const [wishlists, totalItems] = await Promise.all([
      this.prisma.wishlist.findMany({
        where,
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
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.wishlist.count({ where }),
    ]);

    // Tổng số trang
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: wishlists.map((wishlist) => this.mapToResponseDto(wishlist)),
      currentPage,
      totalPages,
      total: totalItems,
      timestamp: new Date().toISOString(),
    };
  }

  async findPublic(
    filter: WishlistFilterDto = {},
  ): Promise<WishlistListResponseDto> {
    const {
      search,
      sortBy = WishlistSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
      currentPage = 1,
      pageSize = 10,
    } = filter;

    // Xây dựng điều kiện where
    const where: any = { isPublic: true };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Thực hiện truy vấn với phân trang
    const [wishlists, totalItems] = await Promise.all([
      this.prisma.wishlist.findMany({
        where,
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
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.wishlist.count({ where }),
    ]);

    // Tổng số trang
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: wishlists.map((wishlist) => this.mapToResponseDto(wishlist)),
      currentPage,
      totalPages,
      total: totalItems,
      timestamp: new Date().toISOString(),
    };
  }

  async findOne(
    id: string,
    userId?: string,
    payload: WishlistItemFilterDto = {},
  ): Promise<WishlistDetailResponseDto> {
    const currentPage = Number(payload.currentPage)|| 1;
    const pageSize = Number(payload.pageSize) || 1;
    const skip = (currentPage - 1) * pageSize ;

    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!wishlist) {
      throw new NotFoundException('Không tìm thấy danh sách yêu thích');
    }

    // Nếu danh sách không phải công khai và người dùng không phải chủ sở hữu
    if (!wishlist.isPublic && wishlist.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền xem danh sách yêu thích này',
      );
    }

    // Xây dựng điều kiện lọc items
    const itemsWhere: any = { wishlistId: id };
    if (payload.search) {
      itemsWhere.product = {
        name: { contains: payload.search, mode: 'insensitive' },
      };
    }

    // Lấy items với phân trang
    const [items, totalItems] = await Promise.all([
      this.prisma.wishlistItem.findMany({
        where: itemsWhere,
        include: {
          product: true,
        },
        orderBy: {
          addedAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.prisma.wishlistItem.count({ where: itemsWhere }),
    ]);

    // Tổng số trang
    const totalPages = Math.ceil(totalItems / pageSize);

    const baseResponse = this.mapToResponseDto({
      ...wishlist,
      items,
    });

    return {
      ...baseResponse,
      currentPage,
      totalPages,
      totalItems,
      timestamp: new Date().toISOString(),
    };
  }

  async update(
    id: string,
    userId: string,
    updateWishlistDto: UpdateWishlistDto,
  ): Promise<WishlistResponseDto> {
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

  async addItem(
    wishlistId: string,
    userId: string,
    addItemDto: AddWishlistItemDto,
  ): Promise<WishlistResponseDto> {
    // Kiểm tra danh sách tồn tại và thuộc về người dùng
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
      throw new ConflictException(
        'Sản phẩm đã tồn tại trong danh sách yêu thích',
      );
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

  async removeItem(
    wishlistId: string,
    itemId: string,
    userId: string,
  ): Promise<WishlistResponseDto> {
    // Kiểm tra danh sách tồn tại và thuộc về người dùng
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
      name: wishlist.name,
      description: wishlist.description,
      isPublic: wishlist.isPublic,
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
