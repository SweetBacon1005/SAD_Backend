import { NotificationGateway } from '@/notification/notification.gateway';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  TransactionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { VoucherService } from '../voucher/voucher.service';
import {
  CancelOrderResponseDto,
  OrderResponseDto,
  OrderStatusResponseDto,
  PaymentStatusResponseDto,
} from './dto/order-response.dto';
import {
  CreateOrderDto,
  GetAllOrderDto,
  GetAllOrderResponseDto,
} from './dto/order.dto';

interface ProductVariant {
  id: string;
  price: number;
  quantity: number;
  attributes: any;
  productId: string;
  createdAt: Date;
  updatedAt: Date | null;
}

interface Product {
  id: string;
  name: string;
  basePrice?: number;
  quantity?: number;
  variants: ProductVariant[];
}

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly voucherService: VoucherService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  private validatePaymentMethod(paymentMethod: PaymentMethod): void {
    if (!paymentMethod) {
      throw new BadRequestException(
        'Phương thức thanh toán không được để trống',
      );
    }

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new BadRequestException('Phương thức thanh toán không hợp lệ');
    }

    const supportedPaymentMethods = [PaymentMethod.COD, PaymentMethod.VNPAY];

    if (!supportedPaymentMethods.includes(paymentMethod)) {
      throw new BadRequestException(
        `Phương thức thanh toán ${paymentMethod} chưa được hỗ trợ. Các phương thức được hỗ trợ: ${supportedPaymentMethods.join(', ')}`,
      );
    }
  }

  private getBestDiscount(productId: any, vouchers: any[]): number {
    const relatedVouchers = vouchers.filter((v) =>
      v?.conditions?.productIds.includes(productId),
    );

    const bestVoucher = relatedVouchers.reduce((max, v) => {
      return !max || v.discountValue > max?.discountValue ? v : max;
    }, null);

    return bestVoucher ? bestVoucher.discountValue : 0;
  }

  async checkVoucher(
    userId: string,
    voucherId: string,
    orderTotal: number,
    productIds?: string[],
  ): Promise<{
    isValid: boolean;
    voucher?: any;
    discountAmount?: number;
    message?: string;
  }> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { id: voucherId },
      });

      if (!voucher) {
        return { isValid: false, message: 'Không tìm thấy voucher' };
      }

      return this.voucherService.validateVoucher(
        voucher.code,
        orderTotal,
        userId,
        productIds,
      );
    } catch (error) {
      return {
        isValid: false,
        message: error.message || 'Lỗi khi kiểm tra voucher',
      };
    }
  }

  async createOrder(
    userId: string,
    payload: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    this.validatePaymentMethod(payload.paymentMethod);

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
          },
        },
      });

      const cartItemsMap = cart
        ? new Map(cart.items.map((item) => [item.id, item]))
        : new Map();

      const currentDate = new Date();
      const vouchers = await this.prisma.voucher.findMany({
        where: {
          isActive: true,
          startDate: { lte: currentDate },
          endDate: { gte: currentDate },
          applicableFor: 'SPECIFIC_PRODUCTS',
        },
      });

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

            const variant = cartItem.variant;

            if (!variant) {
              throw new NotFoundException(
                `Không tìm thấy biến thể với ID ${cartItem.variantId} cho sản phẩm ${cartItem.productId}`,
              );
            }

            if (variant.quantity < item.quantity) {
              throw new BadRequestException(
                `Số lượng biến thể của sản phẩm không đủ. Hiện có: ${variant.quantity}, Yêu cầu: ${item.quantity}`,
              );
            }

            const product = variant.product as Product;

            if (!product) {
              throw new NotFoundException(`Không tìm thấy sản phẩm với ID`);
            }

            return {
              product: {
                ...product,
                discount: this.getBestDiscount(product.id, vouchers),
              },
              cartItem,
              quantity: item.quantity,
              selectedVariant: variant,
            };
          } else if (!item.productId && !item.variantId) {
            throw new BadRequestException(
              'Cần cung cấp productId hoặc cartItemId để tạo đơn hàng',
            );
          } else {
            // Trường hợp 2: Chỉ có productId và variantId (tùy chọn)
            const variant = await prisma.productVariant.findUnique({
              where: { id: item.variantId },
              include: { product: true },
            });

            if (!variant) {
              throw new NotFoundException(
                `Không tìm thấy biến thể với ID ${item.variantId}`,
              );
            }

            if (!variant?.product) {
              throw new NotFoundException(
                `Không tìm thấy sản phẩm với ID ${item.productId}`,
              );
            }

            if (variant.quantity < item.quantity) {
              throw new BadRequestException(
                `Số lượng biến thể của sản phẩm không đủ. Hiện có: ${variant.quantity}, Yêu cầu: ${item.quantity}`,
              );
            }

            return {
              product: {
                ...variant.product,
                discount: this.getBestDiscount(variant.product.id, vouchers),
              },
              quantity: item.quantity,
              selectedVariant: variant,
            };
          }
        }),
      );

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
        const quantity = item.quantity || 1;
        const price =
          selectedVariant.price *
          (1 - (productInfo?.product.discount || 0) / 100);
        subtotal += price * quantity;

        return {
          productId: product?.id || '',
          variantId: selectedVariant?.id,
          quantity: quantity,
          price: price,
          attributes: selectedVariant?.attributes || null,
        };
      });

      let total = subtotal;

      let appliedVoucherId: string | null = null;
      let discountAmount = 0;

      if (payload.voucherId) {
        try {
          const productIds = orderItems.map((item) => item.productId);

          const voucher = await prisma.voucher.findUnique({
            where: { id: payload.voucherId },
          });

          if (!voucher) {
            throw new BadRequestException('Không tìm thấy voucher');
          }

          const validationResult = await this.voucherService.validateVoucher(
            voucher.code,
            subtotal,
            userId,
            productIds,
          );

          if (validationResult.isValid && validationResult.voucher) {
            discountAmount = validationResult.discountAmount || 0;
            total = subtotal - discountAmount;

            if (total < 0) total = 0;

            appliedVoucherId = payload.voucherId;
          } else {
            throw new BadRequestException(
              validationResult.message || 'Voucher không hợp lệ',
            );
          }
        } catch (error) {
          throw new BadRequestException(
            error.message || 'Voucher không hợp lệ hoặc không thể áp dụng',
          );
        }
      }

      const shippingInfo = await prisma.shippingInfo.create({
        data: {
          addressLine: payload.shippingInfo.addressLine,
          phone: payload.shippingInfo.phone,
        },
      });

      const order = await prisma.order.create({
        data: {
          user: {
            connect: { id: userId },
          },
          subtotal,
          total,
          discountAmount,
          voucherId: appliedVoucherId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: payload.paymentMethod,
          notes: payload.notes,
          shippingInfo: {
            connect: { id: shippingInfo.id },
          },

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

      if (appliedVoucherId) {
        await this.voucherService.increaseVoucherUsage(appliedVoucherId);
      }

      await Promise.all(
        payload.items.map(async (item) => {
          const productInfo = productsToCheck.find((p) => {
            if (item.cartItemId) {
              return p.cartItem?.id === item.cartItemId;
            }
            return p.product.id === item.productId;
          });

          const selectedVariant = productInfo?.selectedVariant;

          const quantity = item.quantity || 1;

          if (selectedVariant) {
            await prisma.productVariant.update({
              where: { id: selectedVariant.id },
              data: {
                quantity: { decrement: quantity },
              },
            });
          }
        }),
      );

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

  async getAllOrders(
    payload: GetAllOrderDto,
  ): Promise<GetAllOrderResponseDto<OrderResponseDto>> {
    const page = Number(payload.currentPage) || 1;
    const limit = Number(payload.pageSize) || 10;
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

  async getUserOrders(
    userId: string,
    payload: GetAllOrderDto,
  ): Promise<GetAllOrderResponseDto<OrderResponseDto>> {
    const currentPage = Number(payload.currentPage) || 1;
    const pageSize = Number(payload.pageSize) || 10;
    const skip = (currentPage - 1) * pageSize;

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
        take: pageSize,
      }),
      this.prisma.order.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: orders as unknown as OrderResponseDto[],
      currentPage: currentPage,
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
    role: UserRole,
    userId: string,
  ): Promise<OrderStatusResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (role !== UserRole.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thay đổi trạng thái đơn hàng');
    }

    // if (
    //   order.status === OrderStatus.CANCELLED &&
    //   status !== OrderStatus.CANCELLED
    // ) {
    //   throw new BadRequestException(
    //     'Không thể thay đổi trạng thái đơn hàng đã bị hủy',
    //   );
    // }

    // if (
    //   order.status === OrderStatus.DELIVERED &&
    //   status !== OrderStatus.DELIVERED &&
    //   status !== OrderStatus.CANCELLED
    // ) {
    //   throw new BadRequestException(
    //     'Không thể thay đổi trạng thái đơn hàng đã được giao',
    //   );
    // }

    let updateData: any = { status };

    if (status === OrderStatus.SHIPPED) {
      updateData.shippedAt = new Date();
    }

    if (status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    // Tạo thông báo khi cập nhật trạng thái đơn hàng
    await this.notificationGateway.sendNotification(order.userId, {
      type: 'ORDER_STATUS',
      title: 'Cập nhật đơn hàng',
      message: `Đơn hàng #${order.id} đã được cập nhật trạng thái: ${status}`,
      data: {
        orderId: order.id,
        status,
        previousStatus: order.status,
      },
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

    let orderStatus = order.status;
    if (status === PaymentStatus.PAID && order.status === OrderStatus.PENDING) {
      orderStatus = OrderStatus.PROCESSING;
    } else if (status === PaymentStatus.FAILED) {
      orderStatus = OrderStatus.CANCELLED;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: status,
        status: orderStatus,
      },
    });

    if (order.payment) {
      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status,
        },
      });

      if (transactionId) {
        const transaction = await this.prisma.paymentTransaction.findFirst({
          where: { paymentId: order.payment.id },
        });

        if (transaction) {
          await this.prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
              transactionId,
              status:
                status === PaymentStatus.PAID
                  ? TransactionStatus.SUCCESS
                  : status === PaymentStatus.FAILED
                    ? TransactionStatus.FAILED
                    : TransactionStatus.PENDING,
            },
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

  async cancelOrder(
    id: string,
    userId: string,
  ): Promise<CancelOrderResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findUnique({
        where: { id, userId },
        include: {
          items: true,
          user: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status === OrderStatus.DELIVERED) {
        throw new BadRequestException('Cannot cancel delivered orders');
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });

      // Tạo thông báo khi hủy đơn hàng
      await this.notificationGateway.sendNotification(order.userId, {
        type: 'ORDER_STATUS',
        title: 'Đơn hàng bị hủy',
        message: `Đơn hàng #${order.id} đã bị hủy`,
        data: {
          orderId: order.id,
          previousStatus: order.status,
        },
      });

      if (order.voucherId) {
        const voucher = await prisma.voucher.findUnique({
          where: { id: order.voucherId },
        });

        if (voucher && voucher.usageCount > 0) {
          await prisma.voucher.update({
            where: { id: order.voucherId },
            data: {
              usageCount: {
                decrement: 1,
              },
            },
          });
        }
      }

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
}
