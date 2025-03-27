import { 
    Injectable, 
    NotFoundException, 
    BadRequestException 
  } from '@nestjs/common';
  import { PrismaService } from '../database/prisma.service';
  import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
  import { Prisma } from '@prisma/client';
  
  @Injectable()
  export class ProductService {
    constructor(private prisma: PrismaService) {}
  
    // Create a new product
    async createProduct(data: CreateProductDto) {
      try {
        return await this.prisma.product.create({
          data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            basePrice: data.basePrice,
            categoryIds: data.categoryIds,
            storeId: data.storeId,
            images: data.images,
            metadata: data.metadata as Prisma.JsonObject,
            variants: data.variants ? {
              create: data.variants.map(variant => ({
                name: variant.name,
                description: variant.description,
                price: variant.price,
                costPrice: variant.costPrice,
                quantity: variant.quantity,
                attributes: variant.attributes as Prisma.JsonObject,
                images: variant.images
              }))
            } : undefined
          },
          include: {
            variants: true,
            categories: true
          }
        });
      } catch (error) {
        throw new BadRequestException('Failed to create product');
      }
    }
  
    // Get all products with optional filtering
    async getAllProducts(
      page = 1, 
      limit = 10, 
      filter: { 
        categoryIds?: string[], 
        minPrice?: number, 
        maxPrice?: number 
      } = {}
    ) {
      const skip = (page - 1) * limit;
  
      const where: Prisma.ProductWhereInput = {
        ...(filter.categoryIds && { 
          categoryIds: { 
            hasSome: filter.categoryIds 
          } 
        }),
        ...(filter.minPrice !== undefined && { basePrice: { gte: filter.minPrice } }),
        ...(filter.maxPrice !== undefined && { basePrice: { lte: filter.maxPrice } })
      };
  
      const [total, products] = await Promise.all([
        this.prisma.product.count({ where }),
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          include: {
            variants: true,
            categories: true
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);
  
      return {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    }
  
    // Get product by ID
    async getProductById(id: string) {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          variants: true,
          categories: true,
          reviews: true
        }
      });
  
      if (!product) {
        throw new NotFoundException('Product not found');
      }
  
      return product;
    }
  
    // Get product by slug
    async getProductBySlug(slug: string) {
      const product = await this.prisma.product.findFirst({
        where: { slug },
        include: {
          variants: true,
          categories: true,
          reviews: true
        }
      });
  
      if (!product) {
        throw new NotFoundException('Product not found');
      }
  
      return product;
    }
  
    // Update a product
    async updateProduct(id: string, data: UpdateProductDto) {
      try {
        return await this.prisma.product.update({
          where: { id },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.slug && { slug: data.slug }),
            ...(data.description && { description: data.description }),
            ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
            ...(data.categoryIds && { categoryIds: data.categoryIds }),
            ...(data.storeId && { storeId: data.storeId }),
            ...(data.images && { images: data.images }),
            ...(data.metadata && { metadata: data.metadata as Prisma.JsonObject }),
            // Handle variants separately if needed
          },
          include: {
            variants: true,
            categories: true
          }
        });
      } catch (error) {
        throw new BadRequestException('Failed to update product');
      }
    }
  
    // Delete a product
    async deleteProduct(id: string) {
      try {
        return await this.prisma.product.delete({
          where: { id }
        });
      } catch (error) {
        throw new NotFoundException('Product not found');
      }
    }
  
    // Search products
    async searchProducts(query: string, page = 1, limit = 10) {
      const skip = (page - 1) * limit;
  
      const where: Prisma.ProductWhereInput = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      };
  
      const [total, products] = await Promise.all([
        this.prisma.product.count({ where }),
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          include: {
            variants: true,
            categories: true
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);
  
      return {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    }
  }