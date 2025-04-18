// src/order/order.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Roles } from '../common/decorators/role.decorator';
import { RolesGuard } from '../common/guards/role.guard';
import {
  CancelOrderResponseDto,
  OrderResponseDto,
  OrderStatusResponseDto,
  PaymentStatusResponseDto,
} from './dto/order-response.dto';
import { CreateOrderDto } from './dto/order.dto';
import { PaginationDto, PagedResponseDto } from './dto/pagination.dto';
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

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Tạo đơn hàng mới (từ danh sách sản phẩm)' })
  @ApiCreatedResponse({
    description: 'Đơn hàng đã được tạo thành công',
    type: OrderResponseDto,
  })
  async createOrder(
    @Request() req,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const user = req.user as RequestUser;
    return this.orderService.createOrder(user.id, createOrderDto);
  }

  @Post('from-cart')
  @UseGuards(AuthGuard)
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
    if (!createOrderDto.items.some(item => item.cartItemId)) {
      throw new BadRequestException('Cần cung cấp ít nhất một cartItemId để đặt hàng từ giỏ hàng');
    }
    return this.orderService.createOrder(user.id, createOrderDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng (có phân trang)' })
  @ApiQuery({ name: 'currentPage', required: false, type: Number, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Số mục trên mỗi trang' })
  @ApiOkResponse({
    description: 'Danh sách đơn hàng đã tìm thấy',
    type: PagedResponseDto,
  })
  async getAllOrders(
    @Query() pagination: PaginationDto
  ): Promise<PagedResponseDto<OrderResponseDto>> {
    return this.orderService.getAllOrders(pagination);
  }

  @Get('my-orders')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng của người dùng (có phân trang)' })
  @ApiQuery({ name: 'currentPage', required: false, type: Number, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Số mục trên mỗi trang' })
  @ApiOkResponse({
    description: 'Danh sách đơn hàng đã tìm thấy',
    type: PagedResponseDto,
  })
  async getUserOrders(
    @Request() req,
    @Query() pagination: PaginationDto
  ): Promise<PagedResponseDto<OrderResponseDto>> {
    const user = req.user as RequestUser;
    return this.orderService.getUserOrders(user.id, pagination);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
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
      // If admin, allow access to any order
      if (user.role === UserRole.ADMIN) {
        const order = await this.orderService.getOrderById(id, user.id);
        return order;
      }

      // For regular users, only allow access to their own orders
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

  @Put(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID đơn hàng' })
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
  @UseGuards(AuthGuard, RolesGuard)
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
    // Check if the user is the owner of the order or an admin
    try {
      const user = req['user'];
      if (user.role !== UserRole.ADMIN) {
        // Verify ownership
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
