import { Roles } from '@/common/decorators/role.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import {
  CartItemResponseDto,
  CartResponseDto,
  ClearCartResponseDto,
  RemoveCartItemResponseDto,
} from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('cart')
@Controller('cart')
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Lấy thông tin giỏ hàng của người dùng' })
  @ApiOkResponse({
    description: 'Thông tin giỏ hàng và các sản phẩm trong giỏ',
    type: CartResponseDto,
  })
  async getCart(@Req() req: Request): Promise<CartResponseDto> {
    const { id } = req['user'];

    return this.cartService.getCartByUserId(id);
  }

  @Post('items')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiCreatedResponse({
    description: 'Sản phẩm đã được thêm vào giỏ hàng',
    type: CartItemResponseDto,
  })
  async addItem(
    @Req() req: Request,
    @Body() addCartItemDto: AddCartItemDto,
  ): Promise<CartItemResponseDto> {
    const { id } = req['user'];
    return this.cartService.addItemToCart(id, addCartItemDto);
  }

  @Patch('items')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cập nhật sản phẩm trong giỏ hàng' })
  @ApiOkResponse({
    description: 'Sản phẩm trong giỏ hàng đã được cập nhật',
    type: CartItemResponseDto,
  })
  async updateItem(
    @Req() req: Request,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartItemResponseDto> {
    const { id } = req['user'];
    return this.cartService.updateCartItem(id, updateCartItemDto);
  }

  @Delete('items/:cartItemId')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng' })
  @ApiOkResponse({
    description: 'Sản phẩm đã được xóa khỏi giỏ hàng',
    type: RemoveCartItemResponseDto,
  })
  async removeItem(
    @Req() req: Request,
    @Param('cartItemId') cartItemId: string,
  ): Promise<RemoveCartItemResponseDto> {
    const { id } = req['user'];
    const result = await this.cartService.removeCartItem(id, cartItemId);
    return {
      id: result.id,
      deleted: true,
    };
  }

  @Delete()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Xóa tất cả sản phẩm trong giỏ hàng' })
  @ApiOkResponse({
    description: 'Giỏ hàng đã được làm trống',
    type: ClearCartResponseDto,
  })
  async clearCart(@Req() req: Request): Promise<ClearCartResponseDto> {
    const { id } = req['user'];
    return this.cartService.clearCart(id);
  }
}
