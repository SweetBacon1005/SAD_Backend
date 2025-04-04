import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createReviewDto: CreateReviewDto): Promise<ReviewResponseDto> {
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await this.prisma.product.findUnique({
      where: { id: createReviewDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId: userId,
        productId: createReviewDto.productId,
      },
    });

    if (existingReview) {
      throw new ForbiddenException('Bạn đã đánh giá sản phẩm này rồi');
    }

    // Tạo đánh giá mới
    const review = await this.prisma.review.create({
      data: {
        userId: userId,
        productId: createReviewDto.productId,
        rating: createReviewDto.rating,
        title: createReviewDto.title,
        comment: createReviewDto.comment,
        images: createReviewDto.images || [],
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

    return this.mapToResponseDto(review);
  }

  async findAll(productId?: string): Promise<ReviewResponseDto[]> {
    const where = productId ? { productId, isPublished: true } : { isPublished: true };
    
    const reviews = await this.prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reviews.map(review => this.mapToResponseDto(review));
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
      },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    return this.mapToResponseDto(review);
  }

  async update(id: string, userId: string, updateReviewDto: UpdateReviewDto): Promise<ReviewResponseDto> {
    // Kiểm tra xem đánh giá có tồn tại không
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    // Kiểm tra quyền sở hữu
    if (review.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật đánh giá này');
    }

    // Cập nhật đánh giá
    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: {
        rating: updateReviewDto.rating || review.rating,
        title: updateReviewDto.title || review.title,
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
    // Kiểm tra xem đánh giá có tồn tại không
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    // Kiểm tra quyền sở hữu (hoặc quyền admin)
    if (review.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.prisma.review.delete({
      where: { id },
    });
  }

  async findUserReviews(userId: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
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
        createdAt: 'desc',
      },
    });

    return reviews.map(review => this.mapToResponseDto(review));
  }

  // Helper method to map Prisma model to DTO
  private mapToResponseDto(review: any): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images,
      isPublished: review.isPublished,
      user: review.user ? {
        id: review.user.id,
        name: review.user.name,
      } : undefined,
      product: review.product ? {
        id: review.product.id,
        name: review.product.name,
        image: review.product.images[0] || null,
      } : undefined,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
} 