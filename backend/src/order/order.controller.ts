import {
  Body,
  Controller,
  Get,
  HttpStatus,
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
import { CreateOrderDto, GetAllOrderDto, GetAllOrderResponseDto } from './dto/order.dto';
import { OrderService } from './order.service';

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
    type: GetAllOrderResponseDto,
  })
  async getAllOrders(
    @Query() payload: GetAllOrderDto,
  ): Promise<GetAllOrderResponseDto<OrderResponseDto>> {
    return this.orderService.getAllOrders(payload);
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
    type: GetAllOrderResponseDto,
  })
  async getUserOrders(
    @Req() req: Request,
    @Query() payload: GetAllOrderDto,
  ): Promise<GetAllOrderResponseDto<OrderResponseDto>> {
    const { id: userId } = req['user'];
    return this.orderService.getUserOrders(userId, payload);
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
    @Req() req: Request,
  ): Promise<OrderResponseDto> {
    const { id: userId } = req['user'];
    return this.orderService.getOrderById(id, userId);
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
    @Req() req: Request,
  ) {
    const { id: userId } = req['user'];
    return await this.orderService.checkVoucher(
      userId,
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
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
    const { id: userId } = req['user'];
    return this.orderService.createOrder(userId, createOrderDto);
  }

  @Post('from-cart')
  @ApiOperation({ summary: 'Tạo đơn hàng từ giỏ hàng' })
  @ApiCreatedResponse({
    description: 'Đơn hàng đã được tạo thành công từ giỏ hàng',
    type: OrderResponseDto,
  })
  async createOrderFromCart(
    @Req() req: Request,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const { id: userId } = req['user'];
    return this.orderService.createOrder(userId, createOrderDto);
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
    @Req() req: Request,
  ): Promise<CancelOrderResponseDto> {
    const { id: userId } = req['user'];
    return this.orderService.cancelOrder(id, userId);
  }
}
