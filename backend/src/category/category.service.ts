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
    const { name, description, parentId } = createCategoryDto;

    const slug = slugify(name, { lower: true, strict: true });

    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new BadRequestException(
        `Category with slug ${slug} already exists`,
      );
    }

    if (parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId,
      },
    });

    return this.mapToCategoryDto(category);
  }

  async findAll(parentId?: string): Promise<CategoryResponseDto[]> {
    let where = {};

    if (parentId) {
      where = { parentId };
    }

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: true,
        products: true,
      },
    });

    return categories.map((category) => this.mapToCategoryDto(category));
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
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
        parent: true,
        children: true,
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
    const { name, description, parentId } = updateCategoryDto;

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

    if (parentId && parentId !== existingCategory.parentId) {
      if (parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parentCategory = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw new BadRequestException('Parent category not found');
      }

      const isChild = await this.isChildCategory(id, parentId);
      if (isChild) {
        throw new BadRequestException('Cannot set a child category as parent');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        name: name || existingCategory.name,
        slug,
        description,
        parentId,
      },
      include: {
        parent: true,
        children: true,
        products: true,
      },
    });

    return this.mapToCategoryDto(updatedCategory);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (existingCategory.children && existingCategory.children.length > 0) {
      throw new BadRequestException('Cannot delete category with children');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { success: true, message: 'Category deleted successfully' };
  }

  async findChildren(id: string): Promise<CategoryResponseDto[]> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const children = await this.prisma.category.findMany({
      where: {
        parentId: id,
      },
      include: {
        products: true,
      },
    });

    return children.map((child) => this.mapToCategoryDto(child));
  }

  async findProducts(id: string): Promise<any[]> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            variants: true,
            categories: true,
          },
        },
      },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return existingCategory.products;
  }

  private async isChildCategory(
    parentId: string,
    childId: string,
  ): Promise<boolean> {
    const childCategory = await this.prisma.category.findUnique({
      where: { id: childId },
      include: { children: true },
    });

    if (!childCategory) {
      return false;
    }

    if (childCategory.children.some((child) => child.id === parentId)) {
      return true;
    }

    for (const child of childCategory.children) {
      const isChild = await this.isChildCategory(parentId, child.id);
      if (isChild) {
        return true;
      }
    }

    return false;
  }

  private mapToCategoryDto(category: any): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.name,
            slug: category.parent.slug,
          }
        : null,
      children: category.children
        ? category.children.map((child) => ({
            id: child.id,
            name: child.name,
            slug: child.slug,
          }))
        : [],
      productCount: category.products ? category.products.length : 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
