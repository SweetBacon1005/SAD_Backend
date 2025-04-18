// cart.controller.ts
import { Roles } from '@/common/decorators/role.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
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
  AddCartItemResponseDto,
  CartResponseDto,
  ClearCartResponseDto,
  RemoveCartItemResponseDto,
  UpdateCartResponseDto,
} from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

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
  async getCart(@Request() req: Request): Promise<CartResponseDto> {
    const { id } = req['user'];
    console.log('id', id);

    return this.cartService.getCartByUserId(id);
  }

  @Post('items')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiCreatedResponse({
    description: 'Sản phẩm đã được thêm vào giỏ hàng',
    type: AddCartItemResponseDto,
  })
  async addItem(
    @Request() req: Request,
    @Body() addCartItemDto: AddCartItemDto,
  ): Promise<AddCartItemResponseDto> {
    const { id } = req['user'];
    return this.cartService.addItemToCart(id, addCartItemDto);
  }

  @Patch('items')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cập nhật sản phẩm trong giỏ hàng' })
  @ApiOkResponse({
    description: 'Sản phẩm trong giỏ hàng đã được cập nhật',
    type: AddCartItemResponseDto,
  })
  async updateItem(
    @Request() req: Request,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<AddCartItemResponseDto> {
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
    @Request() req: Request,
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
  async clearCart(@Request() req: Request): Promise<ClearCartResponseDto> {
    const { id } = req['user'];
    return this.cartService.clearCart(id);
  }

  @Patch()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cập nhật thông tin giỏ hàng' })
  @ApiOkResponse({
    description: 'Thông tin giỏ hàng đã được cập nhật',
    type: UpdateCartResponseDto,
  })
  async updateCart(
    @Request() req: Request,
    @Body() updateCartDto: UpdateCartDto,
  ): Promise<UpdateCartResponseDto> {
    const { id } = req['user'];
    return this.cartService.updateCart(id, updateCartDto);
  }

  @Get('count')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Lấy số lượng sản phẩm trong giỏ hàng' })
  @ApiOkResponse({
    description: 'Số lượng sản phẩm trong giỏ hàng',
    type: Number,
  })
  async getCartItemCount(@Request() req: Request): Promise<number> {
    const { id } = req['user'];
    return this.cartService.getCartItemCount(id);
  }
}
