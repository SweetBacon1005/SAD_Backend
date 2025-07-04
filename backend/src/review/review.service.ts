import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ReviewFilterDto,
  ReviewListResponseDto,
  ReviewSortField,
  SortOrder,
} from './dto/pagination-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) { }

  async create(
    userId: string,
    payload: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        order: {
          userId: userId,
          status: OrderStatus.SUCCESS,
        },
        productId: payload.productId,
      },
      include: {
        product: {
          include: {
            reviews: {
              where: {
                userId: userId,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!orderItem) {
      throw new NotFoundException('Bạn chưa mua sản phẩm này');
    }

    const existingReview = orderItem.product.reviews[0];

    if (existingReview) {
      throw new ForbiddenException('Bạn đã đánh giá sản phẩm này rồi');
    }

    const review = await this.prisma.review.create({
      data: {
        userId: userId,
        productId: payload.productId,
        rating: payload.rating,
        comment: payload.comment,
        images: payload.images || [],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const newStar = (orderItem.product.star * orderItem.product.reviews.length + payload.rating) / (orderItem.product.reviews.length + 1);

    const product = await this.prisma.product.update({
      where: { id: payload.productId },
      data: {
        star: newStar,
      },
    });

    return this.mapToResponseDto(review);
  }

  async findAll(payload: ReviewFilterDto = {}): Promise<ReviewListResponseDto> {
    const {
      productId,
      sortBy = ReviewSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = payload;

    const currentPage = Number(payload.currentPage) || 1;
    const pageSize = Number(payload.pageSize) || 10;
    const rating = Number(payload.rating);
    const skip = (currentPage - 1) * pageSize;

    const where: any = {};
    if (productId) {
      where.productId = productId;
    }
    if (rating) {
      where.rating = Number(rating);
    }

    const [reviews, totalItems] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          product: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ]);

    const ratingStatsQuery = await this.prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: {
        rating: true,
      },
    });

    const ratingStats: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    ratingStatsQuery.forEach((item) => {
      ratingStats[item.rating] = item._count.rating;
    });

    const ratingSum = Object.entries(ratingStats).reduce(
      (sum, [rating, count]) => sum + Number(rating) * count,
      0,
    );
    const totalRatings = Object.values(ratingStats).reduce(
      (sum, count) => sum + count,
      0,
    );
    const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: reviews.map((review) => this.mapToResponseDto(review)),
      currentPage,
      totalPages,
      total: totalItems,
      averageRating: Number(averageRating.toFixed(1)),
      ratingStats,
    };
  }

  async findOne(id: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            basePrice: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    return this.mapToResponseDto(review);
  }

  async update(
    id: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật đánh giá này');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: {
        comment: updateReviewDto.comment || review.comment,
        images: updateReviewDto.images || review.images,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updatedReview);
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.prisma.review.delete({
      where: { id },
    });
  }

  async findUserReviews(
    userId: string,
    payload: ReviewFilterDto = {},
  ): Promise<ReviewListResponseDto> {

    const currentPage = Number(payload.currentPage);
    const pageSize = Number(payload.pageSize);
    const skip = (currentPage - 1) * pageSize;
    const {
      productId,
      sortBy = ReviewSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = payload;

    const where: any = { userId };
    if (productId) {
      where.productId = productId;
    }
    if (payload.rating) {
      where.rating = Number(payload.rating);
    }

    const [reviews, totalItems] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ]);

    const ratingStatsQuery = await this.prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: {
        rating: true,
      },
    });

    const ratingStats: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    ratingStatsQuery.forEach((item) => {
      ratingStats[item.rating] = item._count.rating;
    });

    const ratingSum = Object.entries(ratingStats).reduce(
      (sum, [rating, count]) => sum + Number(rating) * count,
      0,
    );
    const totalRatings = Object.values(ratingStats).reduce(
      (sum, count) => sum + count,
      0,
    );
    const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: reviews.map((review) => this.mapToResponseDto(review)),
      currentPage,
      totalPages,
      total: totalItems,
      averageRating: Number(averageRating.toFixed(1)),
      ratingStats,
    };
  }

  private mapToResponseDto(review: any): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images,
      user: review.user
        ? {
          id: review.user.id,
          name: review.user.name,
        }
        : undefined,
      product: review.product
        ? {
          id: review.product.id,
          name: review.product.name,
          image: review.product.images[0] || null,
          basePrice: review.product.basePrice,
        }
        : undefined,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
