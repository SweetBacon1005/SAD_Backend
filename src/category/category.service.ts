import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import slugify from 'slugify';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const { name, description, image} = createCategoryDto;
    
    // Tạo slug từ tên
    const slug = slugify(name, { lower: true, strict: true });
    
    // Kiểm tra slug đã tồn tại chưa
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });
    
    if (existingCategory) {
      throw new BadRequestException(`Category with slug ${slug} already exists`);
    }
    
    const category = await this.prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
      },
    });
    
    return this.mapToCategoryDto(category);
  }

  async findAll(parentId?: string): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({});
    return categories.map(category => this.mapToCategoryDto(category));
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    return this.mapToCategoryDto(category);
  }

  async findBySlug(slug: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        products: true,
      },
    });
    
    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }
    
    return this.mapToCategoryDto(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const { name, description, image} = updateCategoryDto;
    
    // Kiểm tra category tồn tại
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });
    
    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    let slug = existingCategory.slug;
    
    // Nếu tên thay đổi, tạo slug mới
    if (name && name !== existingCategory.name) {
      slug = slugify(name, { lower: true, strict: true });
      
      // Kiểm tra slug mới đã tồn tại chưa (ngoại trừ category hiện tại)
      const slugExists = await this.prisma.category.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });
      
      if (slugExists) {
        throw new BadRequestException(`Category with slug ${slug} already exists`);
      }
    }
    
    // Kiểm tra parentId nếu có
    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        name: name || existingCategory.name,
        slug,
        description,
        image,
      },
      include: {
        products: true,
      },
    });
    
    return this.mapToCategoryDto(updatedCategory);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    // Kiểm tra category tồn tại
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });
    
    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    // Xóa category
    await this.prisma.category.delete({
      where: { id },
    });
    
    return { success: true, message: 'Category deleted successfully' };
  }

  async findProducts(id: string): Promise<any[]> {
    // Kiểm tra category tồn tại
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            variants: true,
            category: true,
          },
        },
      },
    });
    
    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    return existingCategory.products;
  }

  private mapToCategoryDto(category: any): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
} 