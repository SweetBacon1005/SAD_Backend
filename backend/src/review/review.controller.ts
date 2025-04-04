import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { UserRole } from '@prisma/client';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo đánh giá mới' })
  @ApiResponse({ status: 201, description: 'Tạo đánh giá thành công', type: ReviewResponseDto })
  create(@Req() req, @Body() createReviewDto: CreateReviewDto): Promise<ReviewResponseDto> {
    return this.reviewService.create(req.user.id, createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đánh giá' })
  @ApiQuery({ name: 'productId', required: false, description: 'ID sản phẩm để lọc đánh giá' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách đánh giá', type: [ReviewResponseDto] })
  findAll(@Query('productId') productId?: string): Promise<ReviewResponseDto[]> {
    return this.reviewService.findAll(productId);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách đánh giá của người dùng đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách đánh giá của người dùng', type: [ReviewResponseDto] })
  findUserReviews(@Req() req): Promise<ReviewResponseDto[]> {
    return this.reviewService.findUserReviews(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một đánh giá' })
  @ApiParam({ name: 'id', description: 'ID của đánh giá' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin đánh giá', type: ReviewResponseDto })
  findOne(@Param('id') id: string): Promise<ReviewResponseDto> {
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật đánh giá' })
  @ApiParam({ name: 'id', description: 'ID của đánh giá' })
  @ApiResponse({ status: 200, description: 'Đánh giá đã được cập nhật', type: ReviewResponseDto })
  update(
    @Param('id') id: string,
    @Req() req,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.update(id, req.user.id, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa đánh giá' })
  @ApiParam({ name: 'id', description: 'ID của đánh giá' })
  @ApiResponse({ status: 200, description: 'Đánh giá đã được xóa' })
  remove(@Param('id') id: string, @Req() req): Promise<void> {
    return this.reviewService.remove(id, req.user.id);
  }
} 