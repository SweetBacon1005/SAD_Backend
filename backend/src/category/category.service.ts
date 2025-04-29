import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const { name, description, image } = createCategoryDto;

    const existingCategory = await this.prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      throw new BadRequestException(
        `Category with name ${name} already exists`,
      );
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        description,
        image
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

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const { name, description, image } = updateCategoryDto;

    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (name && name !== existingCategory.name) {
      const exists = await this.prisma.category.findFirst({
        where: {
          name,
          id: { not: id },
        },
      });

      if (exists) {
        throw new BadRequestException(
          `Category with name ${name} already exists`,
        );
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        name: name || existingCategory.name,
        description,
        image
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
      description: category.description,
      image: category.image,
      productCount: category.products?.length || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
