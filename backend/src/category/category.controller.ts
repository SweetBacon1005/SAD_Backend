import { Public } from '@/common/decorators/public.decorator';
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
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CategoryService } from './category.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo danh mục' })
  @ApiResponse({
    status: 201,
    description: 'Danh mục đã được tạo thành công',
    type: CategoryResponseDto,
  })
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy tất cả danh mục' })
  @ApiQuery({
    name: 'parentId',
    required: false,
    description: 'Lọc theo danh mục cha',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về tất cả danh mục',
    type: [CategoryResponseDto],
  })
  async getAllCategories(
    @Query('parentId') parentId?: string,
  ): Promise<CategoryResponseDto[]> {
    return this.categoryService.findAll(parentId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Lấy danh mục theo ID' })
  @ApiParam({ name: 'id', description: 'ID danh mục' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh mục',
    type: CategoryResponseDto,
  })
  async getCategoryById(@Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categoryService.findOne(id);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Lấy danh mục theo slug' })
  @ApiParam({ name: 'slug', description: 'Slug danh mục' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh mục',
    type: CategoryResponseDto,
  })
  async getCategoryBySlug(
    @Param('slug') slug: string,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.findBySlug(slug);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật danh mục' })
  @ApiParam({ name: 'id', description: 'ID danh mục' })
  @ApiResponse({
    status: 200,
    description: 'Danh mục đã được cập nhật thành công',
    type: CategoryResponseDto,
  })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa danh mục' })
  @ApiParam({ name: 'id', description: 'ID danh mục' })
  @ApiResponse({ status: 200, description: 'Danh mục đã được xóa thành công' })
  async deleteCategory(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.categoryService.remove(id);
  }

  @Get(':id/children')
  @Public()
  @ApiOperation({ summary: 'Lấy tất cả danh mục con' })
  @ApiParam({ name: 'id', description: 'ID danh mục cha' })
  @ApiResponse({
    status: 200,
    description: 'Trả về tất cả danh mục con',
    type: [CategoryResponseDto],
  })
  async getChildCategories(
    @Param('id') id: string,
  ): Promise<CategoryResponseDto[]> {
    return this.categoryService.findChildren(id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Lấy tất cả sản phẩm trong danh mục' })
  @ApiParam({ name: 'id', description: 'ID danh mục' })
  @ApiResponse({
    status: 200,
    description: 'Trả về tất cả sản phẩm trong danh mục',
  })
  async getCategoryProducts(@Param('id') id: string): Promise<any[]> {
    return this.categoryService.findProducts(id);
  }
}
