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
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { ValidateVoucherResponseDto } from './dto/validate-voucher-response.dto';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';
import { VoucherService } from './voucher.service';

@ApiTags('vouchers')
@Controller('vouchers')
@ApiBearerAuth()
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  // ============== USER APIs ================

  @Post('validate')
  @ApiOperation({ summary: 'Kiểm tra mã voucher cho đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả kiểm tra voucher',
    type: ValidateVoucherResponseDto,
  })
  async validateVoucher(
    @Body() validateVoucherDto: ValidateVoucherDto,
    @Req() req,
  ): Promise<ValidateVoucherResponseDto> {
    const userId =
      validateVoucherDto.userId || (req.user ? req.user.id : undefined);
    return this.voucherService.validateVoucher(
      validateVoucherDto.code,
      validateVoucherDto.orderTotal,
      userId,
      validateVoucherDto.productIds,
    );
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

  @Get('public')
  @ApiOperation({
    summary: 'Lấy danh sách voucher công khai cho tất cả người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách voucher công khai',
    type: [VoucherResponseDto],
  })
  async getPublicVouchers(): Promise<VoucherResponseDto[]> {
    return this.voucherService.getPublicVouchers();
  }
}
