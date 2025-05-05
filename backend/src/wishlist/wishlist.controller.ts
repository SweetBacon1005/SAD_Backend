import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddWishlistItemDto } from './dto/add-wishlist.dto';
import { WishlistFilterDto } from './dto/pagination-wishlist.dto';
import { WishlistResponseDto } from './dto/wishlist-response.dto';
import { WishlistService } from './wishlist.service';

@ApiTags('wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách wishlist của người dùng hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách wishlist của người dùng hiện tại',
    type: WishlistResponseDto,
    isArray: true,
  })
  @ApiBearerAuth()
  async getUserWishlist(@Req() req: Request): Promise<WishlistResponseDto[]> {
    const userId = req['user'].id;
    return this.wishlistService.getWishlistByUserId(userId);
  }

  @Post("search")
  @ApiOperation({
    summary: 'Lấy hoặc tạo mới wishlist của người dùng hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Wishlist đã được tìm thấy hoặc tạo mới.',
    type: WishlistResponseDto,
  })
  @ApiBearerAuth()
  async searchUserWishlist(
    @Req() req: Request,
    @Body() filter: WishlistFilterDto,
  ): Promise<any> {
    const userId = req['user'].id;
    const result = await this.wishlistService.search(userId, filter);
    return result;
  }

  @Post('add-item')
  @ApiOperation({
    summary: 'Thêm sản phẩm vào wishlist của người dùng hiện tại',
  })
  @ApiResponse({
    status: 201,
    description: 'Sản phẩm đã được thêm vào wishlist.',
    type: WishlistResponseDto,
  })
  @ApiBearerAuth()
  async addItem(
    @Req() req: Request,
    @Body() addItemDto: AddWishlistItemDto,
  ): Promise<WishlistResponseDto> {
    const userId = req['user'].id;
    return this.wishlistService.addItem(userId, addItemDto);
  }

  @Delete('items/:productId')
  @ApiOperation({
    summary: 'Xóa sản phẩm khỏi wishlist của người dùng hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Sản phẩm đã được xóa khỏi wishlist.',
    type: WishlistResponseDto,
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'productId', description: 'ID của sản phẩm' })
  async removeItem(
    @Req() req: Request,
    @Param('productId') productId: string,
  ): Promise<WishlistResponseDto> {
    const userId = req['user'].id;
    return this.wishlistService.removeItem(userId, productId);
  }

  @Delete('items')
  @ApiOperation({
    summary: 'Xóa tất cả sản phẩm khỏi wishlist của người dùng hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Tất cả sản phẩm đã được xóa khỏi wishlist.',
    type: WishlistResponseDto,
  })
  @ApiBearerAuth()
  async clearItems(@Req() req: Request): Promise<WishlistResponseDto> {
    const userId = req['user'].id;
    return this.wishlistService.clearItems(userId);
  }
}
