import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import slugify from 'slugify';
import { PrismaService } from '../database/prisma.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const { name, description } = createCategoryDto;

    const slug = slugify(name, { lower: true, strict: true });

    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new BadRequestException(
        `Category with slug ${slug} already exists`,
      );
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        slug,
        description,
      },
    });

    return this.mapToCategoryDto(category);
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      include: {
        products: true,
      },
    });

    return categories.map((category) => this.mapToCategoryDto(category));
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

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const { name, description } = updateCategoryDto;

    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    let slug = existingCategory.slug;

    if (name && name !== existingCategory.name) {
      slug = slugify(name, { lower: true, strict: true });

      const slugExists = await this.prisma.category.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (slugExists) {
        throw new BadRequestException(
          `Category with slug ${slug} already exists`,
        );
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        name: name || existingCategory.name,
        slug,
        description,
      },
      include: {
        products: true,
      },
    });

    return this.mapToCategoryDto(updatedCategory);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (existingCategory.products && existingCategory.products.length > 0) {
      throw new BadRequestException('Cannot delete category with products');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { success: true, message: 'Category deleted successfully' };
  }

  async findProducts(id: string): Promise<any[]> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            variants: true,
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
      productCount: category.products?.length || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
