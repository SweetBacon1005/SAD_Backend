// cart.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  AddCartItemDto,
  UpdateCartDto,
  UpdateCartItemDto,
} from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCartByUserId(userId: string) {
    // Get cart with items and associated products
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                variants: true,
              },
            },
          },
        },
      },
    });

    // Create a new cart if it doesn't exist
    if (!cart) {
      return this.prisma.cart.create({
        data: {
          userId,
        },
        include: {
          items: true,
        },
      });
    }

    return cart;
  }

  async addItemToCart(userId: string, data: AddCartItemDto) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
        },
      });
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: data.productId,
        attributes: (data.attributes as Prisma.JsonObject) || {},
      },
    });

    if (existingItem) {
      // Update quantity if item already exists
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + data.quantity,
        },
        include: {
          product: true,
        },
      });
    } else {
      // Add new item to cart
      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: data.productId,
          quantity: data.quantity,
          attributes: (data.attributes as Prisma.JsonObject) || {},
        },
        include: {
          product: true,
        },
      });
    }
  }

  async updateCartItem(userId: string, data: UpdateCartItemDto) {
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
    const cartItem = cart.items.find((item) => item.id === data.cartItemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Update cart item
    return this.prisma.cartItem.update({
      where: { id: data.cartItemId },
      data: {
        quantity: data.quantity,
        attributes:
          (data.attributes as Prisma.JsonObject) || cartItem.attributes,
      },
      include: {
        product: true,
      },
    });
  }

  async removeCartItem(userId: string, cartItemId: string) {
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
    return this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  async clearCart(userId: string) {
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
    return this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: true,
      },
    });
  }

  async updateCart(userId: string, data: UpdateCartDto) {
    // Get cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Update cart metadata
    return this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        metadata: (data.metadata as Prisma.JsonObject) || cart.metadata,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}
