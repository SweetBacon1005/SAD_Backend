import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { GetAllProductsDto } from './dto/get-products.dto';
import { GetAllProductsResponseDto } from './dto/get-all-products-response.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { ProductDetailResponseDto, ProductResponseDto } from './dto/product-response.dto';
import { SearchProductResponseDto } from './dto/search-product-response.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // Phương thức chuyển đổi Json thành Record<string, any> | null
  private mapProductToResponse(product: any): ProductResponseDto {
    return {
      ...product,
      metadata: product.metadata ? JSON.parse(JSON.stringify(product.metadata)) : null,
      variants: product.variants?.map(variant => ({
        ...variant,
        attributes: variant.attributes ? JSON.parse(JSON.stringify(variant.attributes)) : null
      }))
    };
  }

  // Phương thức chuyển đổi cho danh sách sản phẩm
  private mapProductsToResponse(products: any[]): ProductResponseDto[] {
    return products.map(this.mapProductToResponse);
  }

  async createProduct(data: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description ?? '',
          basePrice: data.basePrice,
          storeId: data.storeId ?? null,
          images: data.images ?? [],
          metadata: data.metadata ? (data.metadata as Prisma.JsonObject) : {},
          categories: {
            connect: data.categoryIds.map((id) => ({ id })),
          },
          variants: data.variants?.length
            ? {
                create: data.variants.map((variant) => ({
                  name: variant.name,
                  description: variant.description ?? '',
                  price: variant.price,
                  costPrice: variant.costPrice,
                  quantity: variant.quantity,
                  attributes: variant.attributes
                    ? (variant.attributes as Prisma.JsonObject)
                    : {},
                  images: variant.images ?? [],
                })),
              }
            : undefined,
        },
        include: {
          variants: true,
          categories: true,
        },
      });
      
      return this.mapProductToResponse(product);
    } catch (error) {
      console.error('Error creating product:', error);
      throw new BadRequestException('Failed to create product');
    }
  }
  

  async getAllProducts(
    payload: GetAllProductsDto,
  ): Promise<GetAllProductsResponseDto> {
    const currentPage = payload.currentPage ?? 1;
    const pageSize = payload.pageSize ?? 10;
    const skip = (currentPage - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {
      categories: payload.categoryIds
        ? {
            some: {
              id: {
                in: payload.categoryIds.split(',').map((id) => id.trim()),
              },
            },
          }
        : undefined,
      basePrice: {
        ...(payload.minPrice ? { gte: payload.minPrice } : {}),
        ...(payload.maxPrice ? { lte: payload.maxPrice } : {}),
      },
    };

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          variants: true,
          categories: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      currentPage,
      totalPages: Math.ceil(total / pageSize),
      total,
      data: this.mapProductsToResponse(products),
    };
  }

  // Get product by ID
  async getProductById(id: string): Promise<ProductDetailResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        categories: true,
        reviews: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      ...this.mapProductToResponse(product),
      reviews: product.reviews,
    };
  }

  // Get product by slug
  async getProductBySlug(slug: string): Promise<ProductDetailResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: { slug },
      include: {
        variants: true,
        categories: true,
        reviews: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      ...this.mapProductToResponse(product),
      reviews: product.reviews,
    };
  }

  // Update a product
  async updateProduct(id: string, data: UpdateProductDto): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.slug && { slug: data.slug }),
          ...(data.description && { description: data.description }),
          ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
          ...(data.categoryIds && { categoryIds: data.categoryIds }),
          ...(data.storeId && { storeId: data.storeId }),
          ...(data.images && { images: data.images }),
          ...(data.metadata && {
            metadata: data.metadata as Prisma.JsonObject,
          }),
          // Handle variants separately if needed
        },
        include: {
          variants: true,
          categories: true,
        },
      });
      
      return this.mapProductToResponse(product);
    } catch (error) {
      throw new BadRequestException('Failed to update product');
    }
  }

  // Delete a product
  async deleteProduct(id: string) {
    try {
      return await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Product not found');
    }
  }

  // Search products
  async searchProducts(payload: SearchProductDto): Promise<SearchProductResponseDto> {
    const currentPage = Number(payload.currentPage);
    const pageSize = Number(payload.pageSize);
    const skip = (currentPage - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {
      OR: [
        { name: { contains: payload.query, mode: 'insensitive' } },
        { description: { contains: payload.query, mode: 'insensitive' } },
      ],
    };

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          variants: true,
          categories: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      currentPage,
      totalPages: Math.ceil(total / pageSize),
      total,
      data: this.mapProductsToResponse(products),
    };
  }
}
