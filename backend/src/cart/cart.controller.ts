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
import { UserRole } from '@prisma/client';
import { CartService } from './cart.service';
import {
  AddCartItemDto,
  UpdateCartDto,
  UpdateCartItemDto,
} from './dto/cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Roles(UserRole.CUSTOMER)
  async getCart(@Request() req: Request) {
    const { id } = req['user'];
    return this.cartService.getCartByUserId(id);
  }

  @Post('items')
  @Roles(UserRole.CUSTOMER)
  async addItem(
    @Request() req: Request,
    @Body() addCartItemDto: AddCartItemDto,
  ) {
    const { id } = req['user'];
    return this.cartService.addItemToCart(id, addCartItemDto);
  }

  @Patch('items')
  @Roles(UserRole.CUSTOMER)
  async updateItem(
    @Request() req: Request,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const { id } = req['user'];
    return this.cartService.updateCartItem(id, updateCartItemDto);
  }

  @Delete('items/:cartItemId')
  @Roles(UserRole.CUSTOMER)
  async removeItem(
    @Request() req: Request,
    @Param('cartItemId') cartItemId: string,
  ) {
    const { id } = req['user'];
    return this.cartService.removeCartItem(id, cartItemId);
  }

  @Delete()
  @Roles(UserRole.CUSTOMER)
  async clearCart(@Request() req: Request) {
    const { id } = req['user'];
    return this.cartService.clearCart(id);
  }

  @Patch()
  @Roles(UserRole.CUSTOMER)
  async updateCart(
    @Request() req: Request,
    @Body() updateCartDto: UpdateCartDto,
  ) {
    const { id } = req['user'];
    return this.cartService.updateCart(id, updateCartDto);
  }
}
