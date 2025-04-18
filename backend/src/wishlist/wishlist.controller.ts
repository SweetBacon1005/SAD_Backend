import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { WishlistResponseDto } from './dto/wishlist-response.dto';
import { WishlistFilterDto, WishlistItemFilterDto, WishlistListResponseDto, WishlistDetailResponseDto } from './dto/pagination-wishlist.dto';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '@/common/decorators/role.decorator';

@ApiTags('wishlists')
@Controller('wishlists')
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo danh sách yêu thích mới' })
  @ApiResponse({ status: 201, description: 'Danh sách yêu thích đã được tạo', type: WishlistResponseDto })
  create(@Req() req, @Body() createWishlistDto: CreateWishlistDto): Promise<WishlistResponseDto> {
    return this.wishlistService.create(req.user.id, createWishlistDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách yêu thích của người dùng đang đăng nhập (có phân trang)' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo tên danh sách' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Trường để sắp xếp (createdAt, updatedAt, name)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Thứ tự sắp xếp (asc, desc)' })
  @ApiQuery({ name: 'currentPage', required: false, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Số lượng trên mỗi trang' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trả về danh sách yêu thích của người dùng có phân trang', 
    type: WishlistListResponseDto 
  })
  findAll(
    @Req() req,
    @Query() filter: WishlistFilterDto
  ): Promise<WishlistListResponseDto> {
    return this.wishlistService.findAll(req.user.id, filter);
  }

  @Get('public')
  @ApiOperation({ summary: 'Lấy danh sách các danh sách yêu thích công khai (có phân trang)' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo tên danh sách' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Trường để sắp xếp (createdAt, updatedAt, name)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Thứ tự sắp xếp (asc, desc)' })
  @ApiQuery({ name: 'currentPage', required: false, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Số lượng trên mỗi trang' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trả về danh sách yêu thích công khai có phân trang', 
    type: WishlistListResponseDto 
  })
  findPublic(
    @Query() filter: WishlistFilterDto
  ): Promise<WishlistListResponseDto> {
    return this.wishlistService.findPublic(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một danh sách yêu thích với các sản phẩm có phân trang' })
  @ApiParam({ name: 'id', description: 'ID của danh sách yêu thích' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm sản phẩm theo tên' })
  @ApiQuery({ name: 'currentPage', required: false, description: 'Trang hiện tại của danh sách sản phẩm' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Số sản phẩm trên mỗi trang' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trả về thông tin danh sách yêu thích với sản phẩm có phân trang', 
    type: WishlistDetailResponseDto 
  })
  findOne(
    @Param('id') id: string, 
    @Req() req,
    @Query() filter: WishlistItemFilterDto
  ): Promise<WishlistDetailResponseDto> {
    return this.wishlistService.findOne(id, req.user?.id, filter);
  }

  @Patch(':id')
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
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa danh sách yêu thích' })
  @ApiParam({ name: 'id', description: 'ID của danh sách yêu thích' })
  @ApiResponse({ status: 200, description: 'Danh sách yêu thích đã được xóa' })
  remove(@Param('id') id: string, @Req() req): Promise<void> {
    return this.wishlistService.remove(id, req.user.id);
  }

  @Post(':id/items')
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