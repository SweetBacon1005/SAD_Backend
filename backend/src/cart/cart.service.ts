import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import {
  CartItemResponseDto,
  CartResponseDto,
  RemoveCartItemResponseDto,
} from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCartToResponse(cart: any, vouchers: any[] = []): CartResponseDto {
    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items.map((item: any) => this.mapCartItemToResponse(item, vouchers)),
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt ? cart.updatedAt.toISOString() : null,
    };
  }

  private mapCartItemToResponse(cartItem: any, vouchers: any[] = []): CartItemResponseDto {
    const relatedVouchers = vouchers.filter((v) =>
      v.conditions.productIds.includes(cartItem.variant.product.id),
    );

    const bestVoucher = relatedVouchers.reduce((max, v) => {
      return !max || v.discountValue > max.discountValue ? v : max;
    }, null);

    const discountValue = bestVoucher ? bestVoucher.discountValue : 0;

    return {
      id: cartItem.id,
      cartId: cartItem.cartId,
      variantId: cartItem.variantId || null,
      quantity: cartItem.quantity,
      addedAt: cartItem.createdAt.toISOString(),
      variant: {
        id: cartItem.variant.id,
        price: cartItem.variant.price,
        quantity: cartItem.variant.quantity,
        attributes: cartItem.variant.attributes,
      },
      product: {
        id: cartItem.variant.product.id,
        name: cartItem.variant.product.name,
        basePrice: cartItem.variant.product.basePrice,
        images: cartItem.variant.product.images,
        discount: discountValue,
        store: cartItem.variant.product.store
          ? {
              id: cartItem.variant.product.store.id,
              name: cartItem.variant.product.store.name,
            }
          : undefined
      },
    };
  }

  async getCartByUserId(userId: string): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    store: true,
                  },
                },
              },
            }
          },
        },
      },
    });

    if (!cart) {
      const newCart = await this.prisma.cart.create({
        data: {
          userId,
        },
        include: {
          items: {
            include: {
              variant: true
            },
          },
        },
      });
      return this.mapCartToResponse(newCart);
    }

    const currentDate = new Date();
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: { lte: currentDate },
        endDate: { gte: currentDate },
        applicableFor: "SPECIFIC_PRODUCTS",
      },
    });

    return this.mapCartToResponse(cart, vouchers);
  }

  async addItemToCart(
    userId: string,
    data: AddCartItemDto,
  ): Promise<CartItemResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      
      const productVariant = await prisma.productVariant.findUnique({
        where: { id: data.variantId },
        include: {
          product: true,
        },
      });

      if (!productVariant) {
        throw new NotFoundException('Biến thể sản phẩm không tồn tại');
      }

      if (!productVariant.product){
        throw new NotFoundException('Sản phẩm không tồn tại');
      }

      if (productVariant.quantity < data.quantity) {
        throw new BadRequestException(
          `Số lượng sản phẩm còn lại không đủ!`,
        );
      }

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

      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          variantId: data.variantId
        },
      });

      if (existingItem) {
        const updatedItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + data.quantity,
          },
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        });
        return this.mapCartItemToResponse(updatedItem);
      } 
      else {
        const newItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: data.variantId,
            quantity: data.quantity,
          },
          include: {
           variant: {
              include: {
                product: {
                  include: {
                    store: true,
                  },
                }
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
  ): Promise<CartItemResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          }
        },
      });

      if (!cart) {
        throw new NotFoundException('Giỏ hàng không tồn tại');
      }

      const cartItem = cart?.items.find(item => item.id === data.cartItemId);

      if (!cartItem) {
        throw new NotFoundException('Item trong giỏ hàng không tồn tại');
      }

      if (!cartItem.variant) {
        throw new NotFoundException('Biến thể sản phẩm không tồn tại');
      }

      if (!cartItem.variant.product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
      }

      if (data.quantity > cartItem.variant.quantity) {
        throw new BadRequestException(
          `Số lượng sản phẩm còn lại không đủ!`,
        );
      }
      const updatedItem = await prisma.cartItem.update({
        where: { id: data.cartItemId },
        data: {
          quantity: data.quantity,
        },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  store: true,
                },
              },
            },
          }
        },
      });
      return this.mapCartItemToResponse(updatedItem);
    });
  }

  async removeCartItem(
    userId: string,
    cartItemId: string,
  ): Promise<RemoveCartItemResponseDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartItem = cart.items.find((item) => item.id === cartItemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    const deletedItem = await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return {
      id: deletedItem.id,
      deleted: true,
    };
  }

  async clearCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    return this.mapCartToResponse(updatedCart);
  }
}
