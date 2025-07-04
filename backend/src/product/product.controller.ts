import { Public } from '@/common/decorators/public.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/role.decorator';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { GetProductsResponseDto } from './dto/get-products-response.dto';
import { GetProductsDto } from './dto/get-products.dto';
import {
  PriceComparisonRequestDto,
  PriceComparisonResponseDto,
} from './dto/price-comparison.dto';
import { ProductComparisonResponseDto } from './dto/product-comparison-response.dto';
import { ProductComparisonRequestDto } from './dto/product-comparison.dto';
import {
  ProductDetailResponseDto,
  ProductResponseDto,
  RecommendProductsResponseDto,
} from './dto/product-response.dto';
import { SearchProductResponseDto } from './dto/search-product-response.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { ProductService } from './product.service';

@ApiTags('products')
@Controller('products')
@ApiBearerAuth()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('recommend')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm được đề xuất' })
  @ApiOkResponse({
    description: 'Danh sách sản phẩm được đề xuất',
    type: RecommendProductsResponseDto,
  })
  async getRecommendProducts(
    @Query('user_id') user_id: string,
  ): Promise<RecommendProductsResponseDto> {
    return this.productService.getRecommendProducts(user_id);
  }

  @Get('all')
  @Public()
  @ApiOperation({ summary: 'Lấy tất cả sản phẩm' })
  @ApiOkResponse({
    description: 'Danh sách tất cả sản phẩm',
    type: GetProductsResponseDto,
  })
  async getAllProducts() {
    return this.productService.getAllProducts();
  }

  @Post('get-products')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm có phân trang' })
  @ApiOkResponse({
    description: 'Danh sách sản phẩm và thông tin phân trang',
    type: GetProductsResponseDto,
  })
  async getProducts(
    @Body() payload: GetProductsDto,
  ): Promise<GetProductsResponseDto> {
    return this.productService.getProducts(payload);
  }

  @Post('search')
  @Public()
  @ApiOperation({ summary: 'Tìm kiếm sản phẩm có phân trang và lọc' })
  @ApiOkResponse({
    description: 'Kết quả tìm kiếm sản phẩm',
    type: SearchProductResponseDto,
  })
  async searchProducts(
    @Body() payload: SearchProductDto,
  ): Promise<SearchProductResponseDto> {
    return this.productService.searchProducts(payload);
  }

  @Post('compare')
  @Public()
  @ApiOperation({ summary: 'So sánh các sản phẩm' })
  @ApiOkResponse({
    description: 'Kết quả so sánh sản phẩm',
    type: ProductComparisonResponseDto,
  })
  async compareProducts(
    @Body() payload: ProductComparisonRequestDto,
  ): Promise<ProductComparisonResponseDto> {
    return this.productService.compareProducts(
      payload.productIds,
      payload.currentPage,
      payload.pageSize,
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Lấy thông tin sản phẩm theo ID' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm' })
  @ApiOkResponse({
    description: 'Thông tin chi tiết sản phẩm',
    type: ProductDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy sản phẩm',
  })
  async getProductById(
    @Param('id') id: string,
  ): Promise<ProductDetailResponseDto> {
    const product = await this.productService.getProductById(id);
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID ${id}`);
    }
    return product;
  }

  @Post('price-comparison')
  @Public()
  @ApiOperation({ summary: 'So sánh giá sản phẩm ở các cửa hàng khác nhau' })
  @ApiOkResponse({
    description: 'Kết quả so sánh giá sản phẩm',
    type: PriceComparisonResponseDto,
  })
  async compareProductPrices(
    @Body() payload: PriceComparisonRequestDto,
  ): Promise<PriceComparisonResponseDto> {
    return this.productService.compareProductPrices(
      payload.productName,
      payload.category,
      payload.inStock,
      payload.currentPage,
      payload.pageSize,
    );
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Tạo sản phẩm mới (Admin/Manager)' })
  @ApiCreatedResponse({
    description: 'Sản phẩm đã được tạo thành công',
    type: ProductResponseDto,
  })
  async createProduct(
    @Body() payload: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.createProduct(payload);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Cập nhật sản phẩm (Admin/Manager)' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm cần cập nhật' })
  @ApiOkResponse({
    description: 'Sản phẩm đã được cập nhật thành công',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy sản phẩm',
  })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa sản phẩm (Admin/Manager)' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm cần xóa' })
  @ApiOkResponse({ description: 'Sản phẩm đã được xóa thành công' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy sản phẩm',
  })
  async deleteProduct(@Param('id') id: string): Promise<void> {
    await this.productService.deleteProduct(id);
  }
}
