import { Roles } from '@/common/decorators/role.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AssignVoucherDto } from './dto/assign-voucher.dto';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { UserVoucherResponseDto } from './dto/user-voucher-response.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';
import { VoucherService } from './voucher.service';

@ApiTags('Vouchers')
@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  // ============== USER APIs ================

  @Get('my-vouchers')
  @ApiOperation({ summary: 'Lấy tất cả voucher của người dùng đang đăng nhập' })
  @ApiQuery({
    name: 'onlyValid',
    required: false,
    description: 'Chỉ lấy voucher còn hiệu lực',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách voucher của người dùng',
    type: [UserVoucherResponseDto],
  })
  async getMyVouchers(
    @Req() req,
    @Query('onlyValid') onlyValid?: string,
  ): Promise<UserVoucherResponseDto[]> {
    const userId = req.user.id;
    return this.voucherService.getUserVouchers(userId, onlyValid === 'true');
  }

  @Get('my-vouchers/count')
  @ApiOperation({
    summary: 'Đếm số lượng voucher của người dùng đang đăng nhập',
  })
  @ApiQuery({
    name: 'onlyValid',
    required: false,
    description: 'Chỉ đếm voucher còn hiệu lực',
    type: Boolean,
  })
  @ApiResponse({ status: 200, description: 'Số lượng voucher của người dùng' })
  async countMyVouchers(
    @Req() req,
    @Query('onlyValid') onlyValid?: string,
  ): Promise<{ count: number }> {
    const userId = req.user.id;
    const count = await this.voucherService.countUserVouchers(
      userId,
      onlyValid === 'true',
    );
    return { count };
  }

  @Post('validate')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Kiểm tra mã voucher cho đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả kiểm tra voucher',
    type: VoucherResponseDto,
  })
  async validateVoucher(
    @Body()
    data: {
      code: string;
      orderTotal: number;
      userId?: string;
      productIds?: string[];
    },
    @Req() req,
  ): Promise<any> {
    const userId = data.userId || req.user.id;
    return this.voucherService.validateVoucher(
      data.code,
      data.orderTotal,
      userId,
      data.productIds,
    );
  }

  @Put('use/:userVoucherId')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Sử dụng một voucher của người dùng đang đăng nhập',
  })
  @ApiParam({ name: 'userVoucherId', description: 'ID của user voucher' })
  @ApiResponse({
    status: 200,
    description: 'Voucher đã được đánh dấu là đã sử dụng',
    type: UserVoucherResponseDto,
  })
  async useMyVoucher(
    @Param('userVoucherId') userVoucherId: string,
    @Req() req,
  ): Promise<UserVoucherResponseDto> {
    await this.voucherService.verifyVoucherOwnership(
      userVoucherId,
      req.user.id,
    );
    return this.voucherService.markVoucherAsUsed(userVoucherId);
  }

  // ============== ADMIN APIs ================

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo voucher' })
  @ApiResponse({
    status: 201,
    description: 'Voucher created successfully',
    type: VoucherResponseDto,
  })
  async createVoucher(
    @Body() createVoucherDto: CreateVoucherDto,
  ): Promise<VoucherResponseDto> {
    return this.voucherService.create(createVoucherDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy tất cả voucher' })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Lọc theo trạng thái',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Return all vouchers',
    type: [VoucherResponseDto],
  })
  async getAllVouchers(
    @Query('isActive') isActive?: string,
  ): Promise<VoucherResponseDto[]> {
    return this.voucherService.findAll(isActive === 'true');
  }

  @Get('code/:code')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy voucher theo code' })
  @ApiParam({ name: 'code', description: 'Mã voucher' })
  @ApiResponse({
    status: 200,
    description: 'Return the voucher',
    type: VoucherResponseDto,
  })
  async getVoucherByCode(
    @Param('code') code: string,
  ): Promise<VoucherResponseDto> {
    return this.voucherService.findByCode(code);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy voucher theo ID' })
  @ApiParam({ name: 'id', description: 'ID voucher' })
  @ApiResponse({
    status: 200,
    description: 'Return the voucher',
    type: VoucherResponseDto,
  })
  async getVoucherById(@Param('id') id: string): Promise<VoucherResponseDto> {
    return this.voucherService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật voucher' })
  @ApiParam({ name: 'id', description: 'ID voucher' })
  @ApiResponse({
    status: 200,
    description: 'Voucher updated successfully',
    type: VoucherResponseDto,
  })
  async updateVoucher(
    @Param('id') id: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ): Promise<VoucherResponseDto> {
    return this.voucherService.update(id, updateVoucherDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa voucher' })
  @ApiParam({ name: 'id', description: 'ID voucher' })
  @ApiResponse({ status: 200, description: 'Voucher đã được xóa thành công' })
  async deleteVoucher(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.voucherService.remove(id);
  }

  @Post('assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Gán voucher cho người dùng' })
  @ApiResponse({
    status: 201,
    description: 'Voucher đã được gán thành công',
    type: UserVoucherResponseDto,
  })
  async assignVoucherToUser(
    @Body() assignVoucherDto: AssignVoucherDto,
  ): Promise<UserVoucherResponseDto> {
    return this.voucherService.assignVoucherToUser(
      assignVoucherDto.userId,
      assignVoucherDto.voucherId,
      assignVoucherDto.expiresAt,
    );
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Lấy danh sách voucher của người dùng bất kỳ (Admin)',
  })
  @ApiParam({ name: 'userId', description: 'ID của người dùng' })
  @ApiQuery({
    name: 'onlyValid',
    required: false,
    description: 'Chỉ lấy voucher còn hiệu lực',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách voucher của người dùng',
    type: [UserVoucherResponseDto],
  })
  async getUserVouchers(
    @Param('userId') userId: string,
    @Query('onlyValid') onlyValid?: string,
  ): Promise<UserVoucherResponseDto[]> {
    return this.voucherService.getUserVouchers(userId, onlyValid === 'true');
  }

  @Get('user/:userId/count')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Đếm số lượng voucher của người dùng bất kỳ (Admin)',
  })
  @ApiParam({ name: 'userId', description: 'ID của người dùng' })
  @ApiQuery({
    name: 'onlyValid',
    required: false,
    description: 'Chỉ đếm voucher còn hiệu lực',
    type: Boolean,
  })
  @ApiResponse({ status: 200, description: 'Số lượng voucher của người dùng' })
  async countUserVouchers(
    @Param('userId') userId: string,
    @Query('onlyValid') onlyValid?: string,
  ): Promise<{ count: number }> {
    const count = await this.voucherService.countUserVouchers(
      userId,
      onlyValid === 'true',
    );
    return { count };
  }

  @Put('user/:userVoucherId/use')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Đánh dấu voucher đã được sử dụng (Admin)' })
  @ApiParam({ name: 'userVoucherId', description: 'ID của user voucher' })
  @ApiResponse({
    status: 200,
    description: 'Voucher đã được đánh dấu là đã sử dụng',
    type: UserVoucherResponseDto,
  })
  async markVoucherAsUsed(
    @Param('userVoucherId') userVoucherId: string,
  ): Promise<UserVoucherResponseDto> {
    return this.voucherService.markVoucherAsUsed(userVoucherId);
  }
}
