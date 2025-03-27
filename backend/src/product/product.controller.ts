import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/role.decorator';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Create a new product (Admin/Manager only)
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }

  // Get all products (Public)
  @Get()
  async getAllProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('categoryIds') categoryIds?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    const categoryIdArray = categoryIds ? categoryIds.split(',') : undefined;
    return this.productService.getAllProducts(page, limit, {
      categoryIds: categoryIdArray,
      minPrice,
      maxPrice,
    });
  }

  // Search products (Public)
  @Get('search')
  async searchProducts(
    @Query('query') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productService.searchProducts(query, page, limit);
  }

  // Get product by ID (Public)
  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }

  // Get product by slug (Public)
  @Get('slug/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productService.getProductBySlug(slug);
  }

  // Update a product (Admin/Manager only)
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(id, updateProductDto);
  }

  // Delete a product (Admin/Manager only)
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteProduct(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }
}
