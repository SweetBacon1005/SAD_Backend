import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  CancelOrderResponseDto,
  OrderResponseDto,
  OrderStatusResponseDto,
  PaymentStatusResponseDto,
} from './dto/order-response.dto';
import { CreateOrderDto } from './dto/order.dto';
import { PagedResponseDto, PaginationDto } from './dto/pagination.dto';

// Định nghĩa interface ProductVariant
interface ProductVariant {
  id: string;
  name: string;
  price: number;
  quantity: number;
  attributes: any;
  productId: string;
  createdAt: Date;
  updatedAt: Date | null;
  description: string;
  costPrice: number;
  images: string[];
}

// Định nghĩa interface Product
interface Product {
  id: string;
  name: string;
  basePrice?: number;
  quantity?: number;
  variants: ProductVariant[];
}

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    userId: string,
    payload: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const orderNumber = this.generateOrderNumber();

    return this.prisma.$transaction(async (prisma) => {
      // Lấy thông tin giỏ hàng
      const cart = await prisma.cart.findUnique({
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

      const cartItemsMap = cart ? new Map(cart.items.map((item) => [item.id, item])) : new Map();

      // Xử lý các sản phẩm từ giỏ hàng hoặc productId/variantId
      const productsToCheck = await Promise.all(
        payload.items.map(async (item) => {
          // Trường hợp 1: Có cartItemId
          if (item.cartItemId && cartItemsMap.size > 0) {
            const cartItem = cartItemsMap.get(item.cartItemId);
            if (!cartItem) {
              throw new NotFoundException(
                `Không tìm thấy sản phẩm với ID ${item.cartItemId} trong giỏ hàng`,
              );
            }

            const product = cartItem.product;
            let selectedVariant: ProductVariant | null = null;
            
            if (cartItem.variantId) {
              selectedVariant =
                product.variants.find((v) => v.id === cartItem.variantId) ||
                null;

              if (!selectedVariant) {
                throw new NotFoundException(
                  `Không tìm thấy biến thể với ID ${cartItem.variantId} cho sản phẩm ${product.name}`,
                );
              }

              if (selectedVariant.quantity < item.quantity) {
                throw new BadRequestException(
                  `Số lượng biến thể ${selectedVariant.name} của sản phẩm ${product.name} không đủ. Hiện có: ${selectedVariant.quantity}, Yêu cầu: ${item.quantity}`,
                );
              }
            } else if (
              (product as any).quantity &&
              (product as any).quantity < item.quantity
            ) {
              throw new BadRequestException(
                `Số lượng sản phẩm ${product.name} không đủ. Hiện có: ${(product as any).quantity}, Yêu cầu: ${item.quantity}`,
              );
            }

            return {
              product,
              cartItem,
              requestedQty: item.quantity,
              selectedVariant,
            };
          } 
          // Trường hợp 2: Chỉ có productId và variantId (tùy chọn)
          else {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
              include: { variants: true },
            });

            if (!product) {
              throw new NotFoundException(
                `Không tìm thấy sản phẩm với ID ${item.productId}`,
              );
            }

            let selectedVariant: ProductVariant | null = null;
            if (item.variantId) {
              selectedVariant =
                product.variants.find((v) => v.id === item.variantId) || null;
                
              if (!selectedVariant) {
                throw new NotFoundException(
                  `Không tìm thấy biến thể với ID ${item.variantId} cho sản phẩm ${item.productId}`,
                );
              }

              if (selectedVariant.quantity < item.quantity) {
                throw new BadRequestException(
                  `Số lượng biến thể ${selectedVariant.name} của sản phẩm ${product.name} không đủ. Hiện có: ${selectedVariant.quantity}, Yêu cầu: ${item.quantity}`,
                );
              }
            } else if (
              (product as any).quantity &&
              (product as any).quantity < item.quantity
            ) {
              throw new BadRequestException(
                `Số lượng sản phẩm ${product.name} không đủ. Hiện có: ${(product as any).quantity}, Yêu cầu: ${item.quantity}`,
              );
            }

            return {
              product,
              requestedQty: item.quantity,
              selectedVariant,
            };
          }
        }),
      );

      // Tính subtotal và total
      let subtotal = 0;
      const orderItems = payload.items.map((item) => {
        const productInfo = productsToCheck.find((p) => {
          if (item.cartItemId) {
            return p.cartItem?.id === item.cartItemId;
          }
          return p.product.id === item.productId;
        });

        const product = productInfo?.product;
        const selectedVariant = productInfo?.selectedVariant;
        const cartItem = productInfo?.cartItem;

        let price;
        if (cartItem) {
          price = cartItem.selectedPrice;
        } else {
          price = selectedVariant
            ? selectedVariant.price
            : product?.basePrice || 0;
        }

        subtotal += price * item.quantity;

        return {
          productId: product?.id || '',
          variantId: selectedVariant?.id,
          quantity: item.quantity,
          price: price,
          attributes: selectedVariant?.attributes || null,
        };
      });

      // For simplicity, total = subtotal (no tax, shipping, etc.)
      const total = subtotal;

      // Create shipping info
      const shippingInfo = await prisma.shippingInfo.create({
        data: {
          addressLine: payload.shippingInfo.addressLine,
          phone: payload.shippingInfo.phone,
        },
      });

      // Create the order
      const order = await prisma.order.create({
        data: {
          userId,
          subtotal,
          total,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: payload.paymentMethod,
          notes: payload.notes,
          shippingInfoId: shippingInfo.id,
          items: {
            create: orderItems,
          },
          payment: {
            create: {
              status: PaymentStatus.PENDING,
              paymentMethod: payload.paymentMethod,
              amount: total,
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingInfo: true,
          payment: true,
        },
      });

      // Cập nhật số lượng tồn kho sau khi tạo đơn hàng
      await Promise.all(
        payload.items.map(async (item) => {
          const productInfo = productsToCheck.find((p) => {
            if (item.cartItemId) {
              return p.cartItem?.id === item.cartItemId;
            }
            return p.product.id === item.productId;
          });

          const selectedVariant = productInfo?.selectedVariant;

          if (selectedVariant) {
            await prisma.productVariant.update({
              where: { id: selectedVariant.id },
              data: {
                quantity: { decrement: item.quantity },
              },
            });
          } else {
            // Cập nhật số lượng tồn kho của sản phẩm nếu không có variant
            const product = productInfo?.product as any;
            if (
              product &&
              product.quantity !== undefined &&
              product.quantity !== null
            ) {
              await prisma.product.update({
                where: { id: product.id },
                data: {
                  // Cập nhật quantity nếu có trong model
                },
              });
            }
          }
        }),
      );

      // Xóa các sản phẩm đã đặt hàng khỏi giỏ hàng nếu có cartItemId
      const cartItemsToRemove = payload.items
        .filter((item) => item.cartItemId)
        .map((item) => item.cartItemId)
        .filter((id): id is string => id !== undefined);

      if (cartItemsToRemove.length > 0) {
        await prisma.cartItem.deleteMany({
          where: {
            id: {
              in: cartItemsToRemove,
            },
          },
        });
      }

      return order as unknown as OrderResponseDto;
    });
  }

  async getAllOrders(pagination: PaginationDto = { currentPage: 1, pageSize: 10 }): Promise<PagedResponseDto<OrderResponseDto>> {
    const page = pagination.currentPage || 1;
    const limit = pagination.pageSize || 10;
    const skip = (page - 1) * limit;

    const [orders, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingInfo: true,
          payment: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.order.count(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: orders as unknown as OrderResponseDto[],
      currentPage: page,
      totalPages,
      total: totalItems,
    };
  }

  async getUserOrders(userId: string, pagination: PaginationDto = { currentPage: 1, pageSize: 10 }): Promise<PagedResponseDto<OrderResponseDto>> {
    const page = pagination.currentPage || 1;
    const limit = pagination.pageSize || 10;
    const skip = (page - 1) * limit;

    const [orders, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingInfo: true,
          payment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.order.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: orders as unknown as OrderResponseDto[],
      currentPage: page,
      totalPages,
      total: totalItems,
    };
  }

  async getOrderById(id: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingInfo: true,
        payment: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order as unknown as OrderResponseDto;
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
  ): Promise<OrderStatusResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate state transitions
    if (
      order.status === OrderStatus.CANCELLED &&
      status !== OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot change status of a cancelled order',
      );
    }

    if (
      order.status === OrderStatus.DELIVERED &&
      status !== OrderStatus.DELIVERED &&
      status !== OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot change status of a delivered order except to cancelled',
      );
    }

    // Update order status and related fields
    let updateData: any = { status };

    // If new status is SHIPPED, set shippedAt date
    if (status === OrderStatus.SHIPPED) {
      updateData.shippedAt = new Date();
    }

    // If new status is DELIVERED, set deliveredAt date
    if (status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt,
    };
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    transactionId?: string,
  ): Promise<PaymentStatusResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update order payment status
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { paymentStatus: status },
    });

    // Update payment entity if it exists
    if (order.payment) {
      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status,
        },
      });

      if (transactionId) {
        const transaction = await this.prisma.paymentTransaction.findFirst({
          where: { paymentId: order.payment.id }
        });

        if (transaction) {
          await this.prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
              transactionId,
              status: status === PaymentStatus.PAID ? TransactionStatus.SUCCESS : 
                      status === PaymentStatus.FAILED ? TransactionStatus.FAILED : 
                      TransactionStatus.PENDING
            }
          });
        }
      }
    }

    return {
      id: updatedOrder.id,
      paymentStatus: updatedOrder.paymentStatus,
      transactionId,
      updatedAt: updatedOrder.updatedAt,
    };
  }

  async cancelOrder(id: string): Promise<CancelOrderResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Cannot cancel orders that are already delivered
      if (order.status === OrderStatus.DELIVERED) {
        throw new BadRequestException('Cannot cancel delivered orders');
      }

      // Update order status to CANCELLED
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });

      // Hoàn trả số lượng tồn kho cho các variant
      await Promise.all(
        order.items.map(async (item) => {
          if (item.variantId) {
            const variant = await prisma.productVariant.findUnique({
              where: { id: item.variantId },
            });

            if (variant) {
              await prisma.productVariant.update({
                where: { id: item.variantId },
                data: {
                  quantity: variant.quantity + item.quantity,
                },
              });
            }
          }
        }),
      );

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
      };
    });
  }

  private generateOrderNumber(): string {
    const timestamp = new Date().getTime().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }
}
