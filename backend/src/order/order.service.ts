import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import { CancelOrderResponseDto, OrderResponseDto, OrderStatusResponseDto, PaymentStatusResponseDto } from './dto/order-response.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const orderNumber = this.generateOrderNumber();

    return this.prisma.$transaction(async (prisma) => {
      const productsToCheck = await Promise.all(
        createOrderDto.items.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { variants: true },
          });

          if (!product) {
            throw new NotFoundException(
              `Product with ID ${item.productId} not found`,
            );
          }

          return { product, requestedQty: item.quantity };
        }),
      );

      if (productsToCheck.some((p) => p.product.variants.length > 0)) {
        throw new ConflictException('Product variants are not supported yet');
      }

      // Calculate subtotal and total
      let subtotal = 0;
      const orderItems = createOrderDto.items.map((item) => {
        const product = productsToCheck.find(
          (p) => p.product.id === item.productId,
        )?.product;
        const price = product?.basePrice || 0;
        subtotal += price * item.quantity;

        return {
          productId: item.productId,
          quantity: item.quantity,
          price: price,
        };
      });

      // For simplicity, total = subtotal (no tax, shipping, etc.)
      const total = subtotal;

      // Create shipping info
      const shippingInfo = await prisma.shippingInfo.create({
        data: {
          addressLine: createOrderDto.shippingInfo.addressLine,
          phone: createOrderDto.shippingInfo.phone,
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
          paymentMethod: createOrderDto.paymentMethod,
          notes: createOrderDto.notes,
          shippingInfoId: shippingInfo.id,
          items: {
            create: orderItems,
          },
          payment: {
            create: {
              status: PaymentStatus.PENDING,
              method: createOrderDto.paymentMethod,
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

      // Clear the user's cart after successful order creation
      const cart = await prisma.cart.findUnique({
        where: { userId },
      });

      if (cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      return order as unknown as OrderResponseDto;
    });
  }

  async getAllOrders(): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
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
    });
    
    return orders as unknown as OrderResponseDto[];
  }

  async getUserOrders(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
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
    });
    
    return orders as unknown as OrderResponseDto[];
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

  async updateOrderStatus(id: string, status: OrderStatus): Promise<OrderStatusResponseDto> {
    const order = await this.prisma.order.findUnique({ where: { id } });

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
          transactionId: transactionId || order.payment.transactionId,
        },
      });
    }

    return {
      id: updatedOrder.id,
      paymentStatus: updatedOrder.paymentStatus,
      transactionId,
      updatedAt: updatedOrder.updatedAt,
    };
  }

  async cancelOrder(id: string): Promise<CancelOrderResponseDto> {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Cannot cancel orders that are already delivered
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivered orders');
    }

    // Update order status to CANCELLED
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt,
    };
  }

  private generateOrderNumber(): string {
    const timestamp = new Date().getTime().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }
}
