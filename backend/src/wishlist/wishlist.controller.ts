import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { WishlistResponseDto } from './dto/wishlist-response.dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/role.guard';

@ApiTags('wishlists')
@Controller('wishlists')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo danh sách yêu thích mới' })
  @ApiResponse({ status: 201, description: 'Danh sách yêu thích đã được tạo', type: WishlistResponseDto })
  create(@Req() req, @Body() createWishlistDto: CreateWishlistDto): Promise<WishlistResponseDto> {
    return this.wishlistService.create(req.user.id, createWishlistDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách yêu thích của người dùng đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách yêu thích của người dùng', type: [WishlistResponseDto] })
  findAll(@Req() req): Promise<WishlistResponseDto[]> {
    return this.wishlistService.findAll(req.user.id);
  }

  @Get('public')
  @ApiOperation({ summary: 'Lấy danh sách các danh sách yêu thích công khai' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách yêu thích công khai', type: [WishlistResponseDto] })
  findPublic(): Promise<WishlistResponseDto[]> {
    return this.wishlistService.findPublic();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một danh sách yêu thích' })
  @ApiParam({ name: 'id', description: 'ID của danh sách yêu thích' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin danh sách yêu thích', type: WishlistResponseDto })
  findOne(@Param('id') id: string, @Req() req): Promise<WishlistResponseDto> {
    return this.wishlistService.findOne(id, req.user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật danh sách yêu thích' })
  @ApiParam({ name: 'id', description: 'ID của danh sách yêu thích' })
  @ApiResponse({ status: 200, description: 'Danh sách yêu thích đã được cập nhật', type: WishlistResponseDto })
  update(
    @Param('id') id: string,
    @Req() req,
    @Body() updateWishlistDto: UpdateWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.update(id, req.user.id, updateWishlistDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa danh sách yêu thích' })
  @ApiParam({ name: 'id', description: 'ID của danh sách yêu thích' })
  @ApiResponse({ status: 200, description: 'Danh sách yêu thích đã được xóa' })
  remove(@Param('id') id: string, @Req() req): Promise<void> {
    return this.wishlistService.remove(id, req.user.id);
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm sản phẩm vào danh sách yêu thích' })
  @ApiParam({ name: 'id', description: 'ID của danh sách yêu thích' })
  @ApiResponse({ status: 201, description: 'Sản phẩm đã được thêm vào danh sách', type: WishlistResponseDto })
  addItem(
    @Param('id') id: string,
    @Req() req,
    @Body() addItemDto: AddWishlistItemDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.addItem(id, req.user.id, addItemDto);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi danh sách yêu thích' })
  @ApiParam({ name: 'id', description: 'ID của danh sách yêu thích' })
  @ApiParam({ name: 'itemId', description: 'ID của mục trong danh sách yêu thích' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được xóa khỏi danh sách', type: WishlistResponseDto })
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Req() req,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.removeItem(id, itemId, req.user.id);
  }
} 