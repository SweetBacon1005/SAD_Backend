import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/role.decorator';
import {
  CancelOrderResponseDto,
  OrderResponseDto,
  OrderStatusResponseDto,
  PaymentStatusResponseDto,
} from './dto/order-response.dto';
import { CreateOrderDto } from './dto/order.dto';
import { PagedResponseDto, PaginationDto } from './dto/pagination.dto';
import { OrderService } from './order.service';

interface RequestUser {
  id: string;
  role: UserRole;
}

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng (có phân trang)' })
  @ApiQuery({
    name: 'currentPage',
    required: false,
    type: Number,
    description: 'Trang hiện tại',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Số mục trên mỗi trang',
  })
  @ApiOkResponse({
    description: 'Danh sách đơn hàng đã tìm thấy',
    type: PagedResponseDto,
  })
  async getAllOrders(
    @Query() pagination: PaginationDto,
  ): Promise<PagedResponseDto<OrderResponseDto>> {
    return this.orderService.getAllOrders(pagination);
  }

  @Get('my-orders')
  @ApiOperation({
    summary: 'Lấy danh sách đơn hàng của người dùng (có phân trang)',
  })
  @ApiQuery({
    name: 'currentPage',
    required: false,
    type: Number,
    description: 'Trang hiện tại',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Số mục trên mỗi trang',
  })
  @ApiOkResponse({
    description: 'Danh sách đơn hàng đã tìm thấy',
    type: PagedResponseDto,
  })
  async getUserOrders(
    @Request() req,
    @Query() pagination: PaginationDto,
  ): Promise<PagedResponseDto<OrderResponseDto>> {
    const user = req.user as RequestUser;
    return this.orderService.getUserOrders(user.id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin đơn hàng theo ID' })
  @ApiParam({ name: 'id', description: 'ID đơn hàng' })
  @ApiOkResponse({
    description: 'Thông tin chi tiết của đơn hàng',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy đơn hàng',
  })
  async getOrderById(
    @Param('id') id: string,
    @Request() req,
  ): Promise<OrderResponseDto> {
    try {
      const user = req.user as RequestUser;
      if (user.role === UserRole.ADMIN) {
        const order = await this.orderService.getOrderById(id, user.id);
        return order;
      }

      return await this.orderService.getOrderById(id, user.id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        const user = req.user as RequestUser;
        throw new NotFoundException(
          user.role === UserRole.ADMIN
            ? 'Order not found'
            : 'Order not found or you do not have permission to access it',
        );
      }
      throw error;
    }
  }

  @Post('check-voucher')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Kiểm tra mã voucher cho đơn hàng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        voucherId: {
          type: 'string',
          example: '60d5ec9d2b5b82a5d5000001',
          description: 'ID của voucher (không phải code)',
        },
        orderTotal: { type: 'number', example: 100000 },
        productIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['60d5ec9d2b5b82a5d5000002'],
        },
      },
      required: ['voucherId', 'orderTotal'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả kiểm tra voucher',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        message: { type: 'string' },
        voucher: {
          type: 'object',
          nullable: true,
        },
        discountAmount: {
          type: 'number',
          nullable: true,
        },
      },
    },
  })
  async checkVoucher(
    @Body()
    data: { voucherId: string; orderTotal: number; productIds?: string[] },
    @Req() req,
  ) {
    return await this.orderService.checkVoucher(
      req.user.id,
      data.voucherId,
      data.orderTotal,
      data.productIds,
    );
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Tạo đơn hàng mới' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Đơn hàng được tạo thành công' })
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    return this.orderService.createOrder(req.user.id, createOrderDto);
  }

  @Post('from-cart')
  @ApiOperation({ summary: 'Tạo đơn hàng từ giỏ hàng' })
  @ApiCreatedResponse({
    description: 'Đơn hàng đã được tạo thành công từ giỏ hàng',
    type: OrderResponseDto,
  })
  async createOrderFromCart(
    @Request() req,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const user = req.user as RequestUser;
    if (!createOrderDto.items.some((item) => item.cartItemId)) {
      throw new BadRequestException(
        'Cần cung cấp ít nhất một cartItemId để đặt hàng từ giỏ hàng',
      );
    }
    return this.orderService.createOrder(user.id, createOrderDto);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID đơn hàng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [
            OrderStatus.PENDING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
          ],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Trạng thái đơn hàng đã được cập nhật',
    type: OrderStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy đơn hàng',
  })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ): Promise<OrderStatusResponseDto> {
    return this.orderService.updateOrderStatus(id, status);
  }

  @Put(':id/payment')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật trạng thái thanh toán (Admin)' })
  @ApiParam({ name: 'id', description: 'ID đơn hàng' })
  @ApiOkResponse({
    description: 'Trạng thái thanh toán đã được cập nhật',
    type: PaymentStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy đơn hàng',
  })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('status') status: PaymentStatus,
    @Body('transactionId') transactionId?: string,
  ): Promise<PaymentStatusResponseDto> {
    return this.orderService.updatePaymentStatus(id, status, transactionId);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng (Người dùng)' })
  @ApiParam({ name: 'id', description: 'ID đơn hàng' })
  @ApiOkResponse({
    description: 'Đơn hàng đã được hủy thành công',
    type: CancelOrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy đơn hàng',
  })
  async cancelOrder(
    @Param('id') id: string,
    @Request() req: Request,
  ): Promise<CancelOrderResponseDto> {
    try {
      const user = req['user'];
      if (user.role !== UserRole.ADMIN) {
        await this.orderService.getOrderById(id, user.id);
      }
      return this.orderService.cancelOrder(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          'Order not found or you do not have permission to cancel it',
        );
      }
      throw error;
    }
  }
}
