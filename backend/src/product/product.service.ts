import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { GetProductsResponseDto as GetProductsResponseDto } from './dto/get-products-response.dto';
import { GetProductsDto as GetProductsDto } from './dto/get-products.dto';
import { PriceComparisonResponseDto } from './dto/price-comparison.dto';
import { ProductComparisonResponseDto } from './dto/product-comparison-response.dto';
import {
  ProductDetailResponseDto,
  ProductResponseDto,
  RecommendProductsResponseDto,
} from './dto/product-response.dto';
import { SearchProductResponseDto } from './dto/search-product-response.dto';
import { SearchProductDto } from './dto/search-product.dto';
import axios from 'axios';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  private mapProductToResponse(product: any): ProductResponseDto {
    return {
      ...product,
      variants: product.variants?.map((variant) => ({
        ...variant,
        attributes: variant.attributes
          ? JSON.parse(JSON.stringify(variant.attributes))
          : null,
      })),
    };
  }

  private mapProductWithVoucherToResponse(product: any, vouchers: any[]): ProductResponseDto {
    const relatedVouchers = vouchers.filter((v) =>
      v.conditions.productIds.includes(product.id),
    );

    const bestVoucher = relatedVouchers.reduce((max, v) => {
      return !max || v.discountValue > max.discountValue ? v : max;
    }, null);

    const discountValue = bestVoucher ? bestVoucher.discountValue : 0;

    return {
      ...product,
      variants: product.variants?.map((variant) => ({
        ...variant,
        attributes: variant.attributes
          ? JSON.parse(JSON.stringify(variant.attributes))
          : null,
      })),
      discount: discountValue,
    };
  }

  async getRecommendProducts(
    user_id: string,
  ): Promise<RecommendProductsResponseDto> {
    if (!user_id) {
      return {
        recommends: [],
        populars: [],
      };
    }

    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/recommend?user_id=${user_id}`,
      );

      if (response.status !== 200) {
        throw new BadRequestException('Failed to fetch recommended products');
      }

      const { recommendIds, popularIds } = response.data;

      const [recommends, populars] = await Promise.all([
        recommendIds.length > 0
          ? this.prisma.product.findMany({
              where: { id: { in: recommendIds } },
            })
          : Promise.resolve([]),

        popularIds.length > 0
          ? this.prisma.product.findMany({
              where: { id: { in: popularIds } },
            })
          : Promise.resolve([]),
      ]);

      const currentDate = new Date();
      const vouchers = await this.prisma.voucher.findMany({
        where: {
          isActive: true,
          startDate: { lte: currentDate },
          endDate: { gte: currentDate },
          applicableFor: "SPECIFIC_PRODUCTS",
        },
      });

      return {
        recommends: recommends.map((product) =>
          this.mapProductWithVoucherToResponse(product, vouchers),
        ),
        populars: populars.map((product) =>
          this.mapProductWithVoucherToResponse(product, vouchers),
        ),
      };
    } catch (error) {
      console.error('Error fetching recommended products');
    }
    return {
      recommends: [],
      populars: [],
    };
  }

  async createProduct(data: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: {
          name: data.name,
          description: data.description ?? '',
          basePrice: data.basePrice,
          storeId: data.storeId ?? null,
          images: data.images ?? [],
          options: data.options ? (data.options as Prisma.JsonObject) : {},
          categoryId: data.categoryId || null,
          variants: data.variants?.length
            ? {
                create: data.variants.map((variant) => ({
                  price: variant.price,
                  quantity: variant.quantity,
                  attributes: variant.attributes
                    ? (variant.attributes as Prisma.JsonObject)
                    : {},
                })),
              }
            : undefined,
        },
        include: {
          variants: true,
          category: true,
        },
      });

      return this.mapProductToResponse(product);
    } catch (error) {
      console.error('Error creating product:', error);
      throw new BadRequestException('Failed to create product');
    }
  }

  async getAllProducts() {
    const products = await this.prisma.product.findMany();

    const currentDate = new Date();
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: { lte: currentDate },
        endDate: { gte: currentDate },
        applicableFor: "SPECIFIC_PRODUCTS",
      },
    });

    return products.map((product) =>
      this.mapProductWithVoucherToResponse(product, vouchers),
    );
  }

  async getProducts(payload: GetProductsDto): Promise<GetProductsResponseDto> {
    const currentPage = Number(payload.currentPage) || 1;
    const pageSize = Number(payload.pageSize) || 10;
    const skip = (currentPage - 1) * pageSize;

    const [total, products] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const currentDate = new Date();
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: { lte: currentDate },
        endDate: { gte: currentDate },
        applicableFor: "SPECIFIC_PRODUCTS",
      },
    });

    return {
      currentPage,
      totalPages: Math.ceil(total / pageSize),
      total,
      data: products.map((product) =>
        this.mapProductWithVoucherToResponse(product, vouchers),
      ),
    };
  }

  async getProductById(id: string): Promise<ProductDetailResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        category: true,
        reviews: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const currentDate = new Date();
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: { lte: currentDate },
        endDate: { gte: currentDate },
        applicableFor: "SPECIFIC_PRODUCTS",
      },
    });

    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/similar?product_id=${id}`,
      );
      if (response.status === 200) {
        const similars = await this.prisma.product.findMany({
          where: {
            id: {
              in: response.data,
            },
          },
          include: {
            variants: true,
            category: true,
          },
        });
        return {
          ...this.mapProductWithVoucherToResponse(product, vouchers),
          reviews: product.reviews,
          similars: similars.map((similarProduct) =>
            this.mapProductWithVoucherToResponse(similarProduct, vouchers),
          ),
        };
      }
    } catch (error) {
      console.error('Error fetching similar products');
    }

    return {
      ...this.mapProductWithVoucherToResponse(product, vouchers),
      reviews: product.reviews,
    };
  }

  async searchProducts(
    payload: SearchProductDto,
  ): Promise<SearchProductResponseDto> {
    const currentPage = Number(payload.currentPage) || 1;
    const pageSize = Number(payload.pageSize) || 10;
    const skip = (currentPage - 1) * pageSize;

    const query = payload.query?.trim();
    const categoryId = payload.categoryId;
    const sortBy = payload?.sortBy;
    const sortOrder = payload?.sortOrder;
    const minPrice = payload.minPrice;
    const maxPrice = payload.maxPrice;
    const haveDiscount = payload.haveDiscount || false;

    const currentDate = new Date();
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: { lte: currentDate },
        endDate: { gte: currentDate },
        applicableFor: "SPECIFIC_PRODUCTS",
      },
    });

    const where: Prisma.ProductWhereInput = {};

    if(haveDiscount) {
      where.id = {
        in: vouchers.flatMap((voucher) => 
          (voucher.conditions as { productIds?: any[] })?.productIds || []
        ),
      };
    }

    if (query) {
      where.OR = [{ name: { contains: query, mode: 'insensitive' } }];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if(minPrice && maxPrice && minPrice > maxPrice) {
      throw new BadRequestException(
        'Giá tối thiểu không được lớn hơn giá tối đa',
      );
    }
    
    if (minPrice && maxPrice) {
      where.basePrice = {
        gte: minPrice,
        lte: maxPrice,
      };
    } else if (minPrice) {
      where.basePrice = {
        gte: minPrice,
      };
    } else if (maxPrice) {
      where.basePrice = {
        lte: maxPrice,
      };
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          variants: true,
          category: true,
        },
        orderBy: sortBy === 'createdAt' ? { createdAt: sortOrder }: { createdAt: "desc" },
      }),
    ]);

    let data = products.map((product) =>
      this.mapProductWithVoucherToResponse(product, vouchers),
    );

    if (sortBy === 'price' && sortOrder) {
      data.sort((a, b) => {
        const discountA = a.discount || 0;
        const priceA = a.basePrice * (1 - discountA / 100);

        const discountB = b.discount || 0;
        const priceB = b.basePrice * (1 - discountB / 100);
    
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    }

    data = data.slice(skip, skip + pageSize);

    return {
      currentPage,
      totalPages: Math.ceil(total / pageSize),
      total,
      data,
    };
  }

  async compareProducts(
    productIds: string[],
    currentPage: number = 1,
    pageSize: number = 10,
  ): Promise<ProductComparisonResponseDto> {
    if (productIds.length < 2) {
      throw new BadRequestException('Cần ít nhất 2 sản phẩm để so sánh');
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: {
        variants: true,
        reviews: true,
        category: true,
      },
    });

    if (products.length !== productIds.length) {
      const foundProductIds = products.map((p) => p.id);
      const missingProductIds = productIds.filter(
        (id) => !foundProductIds.includes(id),
      );

      throw new NotFoundException(
        `Không tìm thấy sản phẩm với ID: ${missingProductIds.join(', ')}`,
      );
    }

    const comparisonProducts = products.map((product) => {
      const ratings = product.reviews.map((review) => review.rating);
      const averageRating = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        id: product.id,
        name: product.name,
        price: product.basePrice,
        image: product.images.length ? product.images[0] : '',
        description: product.description || '',
        averageRating,
        reviewCount: product.reviews.length,
        variantCount: product.variants.length,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          price: variant.price,
          quantity: variant.quantity,
          attributes: variant.attributes
            ? JSON.parse(JSON.stringify(variant.attributes))
            : {},
        })),
      };
    });

    const features = [
      {
        name: 'Giá',
        values: products.map((p) => p.basePrice.toString()),
      },
      {
        name: 'Danh mục',
        values: products.map((p) => p.category?.name || 'Không có'),
      },
    ];

    const alloptionsKeys = new Set<string>();
    products.forEach((product) => {
      if (product.options) {
        const options = JSON.parse(JSON.stringify(product.options));
        Object.keys(options).forEach((key) => alloptionsKeys.add(key));
      }
    });

    alloptionsKeys.forEach((key) => {
      features.push({
        name: key,
        values: products.map((product) => {
          if (product.options) {
            const options = JSON.parse(JSON.stringify(product.options));
            const value = options[key];
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

    const recommendations: Record<string, string> = {};

    const valueScores = comparisonProducts.map((p, index) => ({
      id: p.id,
      score: p.averageRating / products[index].basePrice,
    }));

    const bestValue = valueScores.reduce(
      (best, current) => (current.score > best.score ? current : best),
      valueScores[0],
    );

    recommendations.bestValue = bestValue.id;

    const qualityScores = comparisonProducts.map((p) => ({
      id: p.id,
      score: p.averageRating * (p.reviewCount > 0 ? 1 : 0.5),
    }));

    const bestQuality = qualityScores.reduce(
      (best, current) => (current.score > best.score ? current : best),
      qualityScores[0],
    );

    recommendations.bestQuality = bestQuality.id;

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

  async compareProductPrices(
    productName: string,
    category?: string,
    inStock?: boolean,
    currentPage: number = 1,
    pageSize: number = 10,
  ): Promise<PriceComparisonResponseDto> {
    const where: Prisma.ProductWhereInput = {
      name: {
        contains: productName,
        mode: 'insensitive',
      },
      ...(category
        ? {
            categoryId: {
              not: null,
            },
            category: {
              name: {
                contains: category,
                mode: 'insensitive',
              },
            },
          }
        : {}),
    };

    const products = await this.prisma.product.findMany({
      where,
      include: {
        variants: true,
        store: true,
        category: true,
      },
    });

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

    const filteredProducts = inStock
      ? products.filter((product) =>
          product.variants.some((variant) => variant.quantity > 0),
        )
      : products;

    const allResults = filteredProducts.map((product) => {
      const lowestVariantPrice = product.variants.length
        ? Math.min(...product.variants.map((v) => v.price))
        : product.basePrice;

      const productInStock = product.variants.some((v) => v.quantity > 0);

      const transformedVariants = product.variants.map((variant) => ({
        id: variant.id,
        price: variant.price,
        quantity: variant.quantity,
        attributes: variant.attributes
          ? JSON.parse(JSON.stringify(variant.attributes))
          : null,
      }));

      return {
        storeId: product.storeId || '',
        storeName: product.store?.name || 'Không có thông tin',
        storeAddress: product.store?.address || 'Không có thông tin',
        productId: product.id,
        productName: product.name,
        price: lowestVariantPrice,
        imageUrl: product.images.length ? product.images[0] : '',
        inStock: productInStock,
        productUrl: `/products/${product.id}`,
        category: product.category
          ? {
              id: product.category.id,
              name: product.category.name,
            }
          : undefined,
        promotion: product.options
          ? JSON.parse(JSON.stringify(product.options)).promotion || null
          : null,
        variants: transformedVariants,
      };
    });

    allResults.sort((a, b) => a.price - b.price);

    const total = allResults.length;
    const totalPages = Math.ceil(total / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const results = allResults.slice(skip, skip + pageSize);

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

  async updateProduct(
    id: string,
    data: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description && { description: data.description }),
          ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.storeId && { storeId: data.storeId }),
          ...(data.images && { images: data.images }),
          ...(data.options && {
            options: data.options as Prisma.JsonObject,
          }),
        },
        include: {
          variants: true,
          category: true,
        },
      });

      return this.mapProductToResponse(product);
    } catch (error) {
      throw new BadRequestException('Failed to update product');
    }
  }

  async deleteProduct(id: string) {
    try {
      return await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Product not found');
    }
  }
}
