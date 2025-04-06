import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { GetAllProductsResponseDto } from './dto/get-all-products-response.dto';
import { GetAllProductsDto } from './dto/get-products.dto';
import {
  ProductDetailResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto';
import { SearchProductResponseDto } from './dto/search-product-response.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { ProductComparisonResponseDto } from './dto/product-comparison-response.dto';
import { PriceComparisonResponseDto } from './dto/price-comparison.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // Phương thức chuyển đổi Json thành Record<string, any> | null
  private mapProductToResponse(product: any): ProductResponseDto {
    return {
      ...product,
      metadata: product.metadata
        ? JSON.parse(JSON.stringify(product.metadata))
        : null,
      variants: product.variants?.map((variant) => ({
        ...variant,
        attributes: variant.attributes
          ? JSON.parse(JSON.stringify(variant.attributes))
          : null,
      })),
    };
  }

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
  async updateProduct(
    id: string,
    data: UpdateProductDto,
  ): Promise<ProductResponseDto> {
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
  async searchProducts(
    payload: SearchProductDto,
  ): Promise<SearchProductResponseDto> {
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

  // Phương thức so sánh sản phẩm
  async compareProducts(
    productIds: string[],
    currentPage: number = 1,
    pageSize: number = 10,
  ): Promise<ProductComparisonResponseDto> {
    // Kiểm tra xem có đủ sản phẩm để so sánh không
    if (productIds.length < 2) {
      throw new BadRequestException('Cần ít nhất 2 sản phẩm để so sánh');
    }

    // Lấy thông tin chi tiết của tất cả sản phẩm
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: {
        variants: true,
        reviews: true,
        categories: true,
      },
    });

    // Kiểm tra xem tất cả sản phẩm có tồn tại không
    if (products.length !== productIds.length) {
      // Tìm ID của sản phẩm không tồn tại
      const foundProductIds = products.map((p) => p.id);
      const missingProductIds = productIds.filter(
        (id) => !foundProductIds.includes(id),
      );

      throw new NotFoundException(
        `Không tìm thấy sản phẩm với ID: ${missingProductIds.join(', ')}`,
      );
    }

    // Tạo danh sách sản phẩm so sánh
    const comparisonProducts = products.map((product) => {
      // Tính toán đánh giá trung bình
      const ratings = product.reviews.map((review) => review.rating);
      const averageRating = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.basePrice,
        image: product.images.length ? product.images[0] : '',
        description: product.description || '',
        averageRating,
        reviewCount: product.reviews.length,
        variantCount: product.variants.length,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          description: variant.description,
          price: variant.price,
          costPrice: variant.costPrice,
          quantity: variant.quantity,
          attributes: variant.attributes
            ? JSON.parse(JSON.stringify(variant.attributes))
            : {},
          images: variant.images,
        })),
      };
    });

    // Tạo danh sách các thuộc tính so sánh
    // Bắt đầu với các thuộc tính cơ bản
    const features = [
      {
        name: 'Giá',
        values: products.map((p) => p.basePrice.toString()),
      },
      {
        name: 'Danh mục',
        values: products.map(
          (p) => p.categories.map((c) => c.name).join(', ') || 'Không có',
        ),
      },
    ];

    // Thu thập các thuộc tính từ metadata của sản phẩm
    const allMetadataKeys = new Set<string>();
    products.forEach((product) => {
      if (product.metadata) {
        const metadata = JSON.parse(JSON.stringify(product.metadata));
        Object.keys(metadata).forEach((key) => allMetadataKeys.add(key));
      }
    });

    // Thêm các thuộc tính từ metadata vào danh sách so sánh
    allMetadataKeys.forEach((key) => {
      features.push({
        name: key,
        values: products.map((product) => {
          if (product.metadata) {
            const metadata = JSON.parse(JSON.stringify(product.metadata));
            const value = metadata[key];
            return value !== undefined
              ? Array.isArray(value)
                ? value.join(', ')
                : value.toString()
              : 'Không có thông tin';
          }
          return 'Không có thông tin';
        }),
      });
    });

    // Xác định sản phẩm tốt nhất dựa trên tiêu chí
    const recommendations: Record<string, string> = {};

    // Sản phẩm có giá trị tốt nhất (dựa trên đánh giá và giá)
    const valueScores = comparisonProducts.map((p, index) => ({
      id: p.id,
      score: p.averageRating / products[index].basePrice,
    }));

    const bestValue = valueScores.reduce(
      (best, current) => (current.score > best.score ? current : best),
      valueScores[0],
    );

    recommendations.bestValue = bestValue.id;

    // Sản phẩm có chất lượng tốt nhất (dựa trên đánh giá)
    const qualityScores = comparisonProducts.map((p) => ({
      id: p.id,
      score: p.averageRating * (p.reviewCount > 0 ? 1 : 0.5), // Ưu tiên sản phẩm có nhiều đánh giá
    }));

    const bestQuality = qualityScores.reduce(
      (best, current) => (current.score > best.score ? current : best),
      qualityScores[0],
    );

    recommendations.bestQuality = bestQuality.id;

    // Tính toán phân trang
    const total = comparisonProducts.length;
    const totalPages = Math.ceil(total / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const paginatedProducts = comparisonProducts.slice(skip, skip + pageSize);

    return {
      products: paginatedProducts,
      features,
      recommendations,
      currentPage,
      totalPages,
      total,
    };
  }

  // So sánh giá sản phẩm ở các cửa hàng khác nhau
  async compareProductPrices(
    productName: string,
    category?: string,
    inStock?: boolean,
    currentPage: number = 1,
    pageSize: number = 10,
  ): Promise<PriceComparisonResponseDto> {
    // Các điều kiện tìm kiếm
    const where: Prisma.ProductWhereInput = {
      name: {
        contains: productName,
        mode: 'insensitive',
      },
      ...(category
        ? {
            categories: {
              some: {
                name: {
                  contains: category,
                  mode: 'insensitive',
                },
              },
            },
          }
        : {}),
    };

    // Lấy tất cả sản phẩm phù hợp với điều kiện tìm kiếm
    const products = await this.prisma.product.findMany({
      where,
      include: {
        variants: true,
        store: true,
      },
    });

    // Giá trị mặc định cho lowestPrice
    const defaultLowestPrice = {
      price: 0,
      storeId: '',
      storeName: '',
    };

    if (products.length === 0) {
      return {
        searchTerm: productName,
        results: [],
        lowestPrice: defaultLowestPrice,
        timestamp: new Date().toISOString(),
        currentPage: currentPage,
        totalPages: 0,
        total: 0,
      };
    }

    // Lọc sản phẩm theo trạng thái tồn kho nếu có yêu cầu
    const filteredProducts = inStock
      ? products.filter((product) =>
          product.variants.some((variant) => variant.quantity > 0),
        )
      : products;
    
    // Tạo danh sách kết quả
    const allResults = filteredProducts.map((product) => {
      // Tính giá thấp nhất từ các biến thể (nếu có)
      const lowestVariantPrice = product.variants.length
        ? Math.min(...product.variants.map((v) => v.price))
        : product.basePrice;

      // Kiểm tra tình trạng tồn kho
      const productInStock = product.variants.some((v) => v.quantity > 0);

      const transformedVariants = product.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        quantity: variant.quantity,
        description: variant.description,
        attributes: variant.attributes 
          ? JSON.parse(JSON.stringify(variant.attributes))
          : null,
        images: variant.images
      }));

      return {
        storeId: product.storeId || '',
        storeName: product.store?.name || 'Không có thông tin',
        storeAddress: product.store?.address || 'Không có thông tin',
        productId: product.id,
        productName: product.name,
        price: lowestVariantPrice,
        imageUrl: product.images.length ? product.images[0] : '',
        productUrl: `/products/${product.slug}`,
        inStock: productInStock,
        promotion: product.metadata
          ? JSON.parse(JSON.stringify(product.metadata)).promotion || null
          : null,
        variants: transformedVariants
      };
    });

    // Sắp xếp kết quả theo giá từ thấp đến cao
    allResults.sort((a, b) => a.price - b.price);

    // Tính toán phân trang
    const total = allResults.length;
    const totalPages = Math.ceil(total / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const results = allResults.slice(skip, skip + pageSize);

    // Xác định giá thấp nhất
    const lowestPrice = allResults.length
      ? {
          price: allResults[0].price,
          storeId: allResults[0].storeId,
          storeName: allResults[0].storeName,
        }
      : defaultLowestPrice;

    return {
      searchTerm: productName,
      results,
      lowestPrice,
      timestamp: new Date().toISOString(),
      currentPage,
      totalPages,
      total,
    };
  }
}
