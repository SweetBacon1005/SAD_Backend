// cart.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductVariant } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  AddCartItemResponseDto,
  CartResponseDto,
  RemoveCartItemResponseDto,
} from './dto/cart-response.dto';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCartByUserId(userId: string): Promise<CartResponseDto> {
    // Get cart with items and associated products
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                variants: true,
                store: true, // Kèm thông tin cửa hàng để hiển thị
              },
            },
          },
        },
      },
    });

    // Create a new cart if it doesn't exist
    if (!cart) {
      const newCart = await this.prisma.cart.create({
        data: {
          userId,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  variants: true,
                  store: true,
                },
              },
            },
          },
        },
      });
      return this.mapCartToResponse(newCart);
    }

    return this.mapCartToResponse(cart);
  }

  // Hàm chuyển đổi từ Cart entity sang CartResponseDto
  private mapCartToResponse(cart: any): CartResponseDto {
    // Tính tổng số sản phẩm
    const totalItems = cart.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    // Tính tổng giá trị từ selectedPrice
    const totalAmount = cart.items.reduce((total, item) => {
      return total + item.selectedPrice * item.quantity;
    }, 0);

    // Chuyển đổi các thuộc tính
    const items = cart.items.map((item) => {
      // Tìm variant đã chọn (nếu có)
      const selectedVariant = item.variantId 
        ? item.product.variants.find(v => v.id === item.variantId)
        : null;
      
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId || null,
        selectedPrice: item.selectedPrice,
        quantity: item.quantity,
        addedAt: item.createdAt.toISOString(),
        product: {
          id: item.product.id,
          name: item.product.name,
          basePrice: item.product.basePrice,
          images: item.product.images,
          store: item.product.store ? {
            id: item.product.store.id,
            name: item.product.store.name,
          } : undefined,
          variants: item.product.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price,
            quantity: variant.quantity,
            isSelected: variant.id === item.variantId
          })),
          selectedVariant: selectedVariant ? {
            id: selectedVariant.id,
            name: selectedVariant.name,
            price: selectedVariant.price,
            quantity: selectedVariant.quantity,
          } : null,
        },
        totalPrice: item.selectedPrice * item.quantity,
      };
    });

    return {
      id: cart.id,
      userId: cart.userId,
      items: items,
      metadata: cart.metadata ? JSON.parse(JSON.stringify(cart.metadata)) : {},
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt ? cart.updatedAt.toISOString() : null,
      totalItems,
      totalAmount,
    };
  }

  // Hàm chuyển đổi từ CartItem entity sang AddCartItemResponseDto
  private mapCartItemToResponse(cartItem: any): AddCartItemResponseDto {
    return {
      id: cartItem.id,
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      variantId: cartItem.variantId || null,
      selectedPrice: cartItem.selectedPrice,
      quantity: cartItem.quantity,
      addedAt: cartItem.createdAt.toISOString(),
      product: {
        id: cartItem.product.id,
        name: cartItem.product.name,
        basePrice: cartItem.product.basePrice,
        images: cartItem.product.images,
        store: cartItem.product.store ? {
          id: cartItem.product.store.id,
          name: cartItem.product.store.name,
        } : undefined,
        selectedVariant: cartItem.variantId ? {
          id: cartItem.variantId,
          name: cartItem.product.variants?.find(v => v.id === cartItem.variantId)?.name || 'Unknown Variant',
          price: cartItem.selectedPrice,
          quantity: cartItem.product.variants?.find(v => v.id === cartItem.variantId)?.quantity || 0,
        } : null
      },
      totalPrice: cartItem.selectedPrice * cartItem.quantity,
    };
  }

  async addItemToCart(
    userId: string,
    data: AddCartItemDto,
  ): Promise<AddCartItemResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
        include: {
          variants: true,
          store: true,
        },
      });

      if (!product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
      }

      // Xác định variant và giá
      let selectedPrice = product.basePrice;
      let selectedVariant: ProductVariant | undefined = undefined;

      if (data.variantId) {
        // Nếu có variantId, kiểm tra variant tồn tại
        selectedVariant = product.variants.find((v) => v.id === data.variantId);
        if (!selectedVariant) {
          throw new NotFoundException('Biến thể sản phẩm không tồn tại');
        }
        selectedPrice = selectedVariant.price;

        // Kiểm tra số lượng tồn kho
        if (data.quantity > selectedVariant.quantity) {
          throw new BadRequestException(
            `Số lượng yêu cầu vượt quá số lượng tồn kho (${selectedVariant.quantity})`,
          );
        }
      }

      // Tìm hoặc tạo giỏ hàng
      let cart = await prisma.cart.findUnique({
        where: { userId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            userId,
          },
        });
      }

      // Kiểm tra sản phẩm đã tồn tại trong giỏ hàng chưa
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: data.productId,
          ...(selectedVariant ? { variantId: selectedVariant.id } : {}),
        },
      });

      if (existingItem) {
        // Cập nhật số lượng nếu sản phẩm đã tồn tại
        const updatedItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + data.quantity,
            selectedPrice: selectedPrice, // Cập nhật giá mới nhất
          },
          include: {
            product: {
              include: {
                store: true,
                variants: true,
              },
            },
          },
        });
        return this.mapCartItemToResponse(updatedItem);
      } else {
        // Thêm sản phẩm mới vào giỏ hàng
        const newItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: data.productId,
            variantId: selectedVariant?.id,
            selectedPrice: selectedPrice,
            quantity: data.quantity,
          },
          include: {
            product: {
              include: {
                store: true,
                variants: true,
              },
            },
          },
        });
        return this.mapCartItemToResponse(newItem);
      }
    });
  }

  async updateCartItem(
    userId: string,
    data: UpdateCartItemDto,
  ): Promise<AddCartItemResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: true,
        },
      });

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      const cartItem = cart.items.find((item) => item.id === data.cartItemId);
      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }

      let selectedPrice = cartItem.selectedPrice;
      let variantId = cartItem.variantId;

      if (data.variantId && data.variantId !== cartItem.variantId) {
        const product = await prisma.product.findUnique({
          where: { id: cartItem.productId },
          include: { variants: true },
        });

        if (!product) {
          throw new NotFoundException('Sản phẩm không tồn tại');
        }

        const newVariant = product.variants.find((v) => v.id === data.variantId);
        if (!newVariant) {
          throw new NotFoundException('Biến thể sản phẩm không tồn tại');
        }

        if (data.quantity > newVariant.quantity) {
          throw new BadRequestException(
            `Số lượng yêu cầu vượt quá số lượng tồn kho (${newVariant.quantity})`,
          );
        }

        // Cập nhật giá và variantId
        selectedPrice = newVariant.price;
        variantId = newVariant.id;
      }

      // Update cart item
      const updatedItem = await prisma.cartItem.update({
        where: { id: data.cartItemId },
        data: {
          quantity: data.quantity,
          variantId: variantId,
          selectedPrice: selectedPrice,
        },
        include: {
          product: {
            include: {
              store: true,
              variants: true,
            },
          },
        },
      });
      return this.mapCartItemToResponse(updatedItem);
    });
  }

  async removeCartItem(
    userId: string,
    cartItemId: string,
  ): Promise<RemoveCartItemResponseDto> {
    // Get cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Check if cart item belongs to user's cart
    const cartItem = cart.items.find((item) => item.id === cartItemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Delete cart item
    const deletedItem = await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return {
      id: deletedItem.id,
      deleted: true,
    };
  }

  async clearCart(userId: string): Promise<CartResponseDto> {
    // Get cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Delete all cart items
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Return empty cart
    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                variants: true,
                store: true,
              },
            },
          },
        },
      },
    });

    return this.mapCartToResponse(updatedCart);
  }

  async updateCart(
    userId: string,
    data: UpdateCartDto,
  ): Promise<CartResponseDto> {
    // Get cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Update cart metadata
    const updatedCart = await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        metadata: data.metadata as Prisma.JsonObject,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                variants: true,
                store: true,
              },
            },
          },
        },
      },
    });
    return this.mapCartToResponse(updatedCart);
  }

  async getCartItemCount(userId: string): Promise<number> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) {
      return 0;
    }

    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }
}
