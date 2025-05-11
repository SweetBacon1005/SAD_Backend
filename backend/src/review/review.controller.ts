import { Roles } from '@/common/decorators/role.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewFilterDto, ReviewListResponseDto } from './dto/pagination-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

@ApiTags('reviews')
@Controller('reviews')
@ApiBearerAuth()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Tạo đánh giá mới' })
  @ApiResponse({
    status: 201,
    description: 'Tạo đánh giá thành công',
    type: ReviewResponseDto,
  })
  create(
    @Req() req: Request,
    @Body() payload: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const { id } = req['user'];
    return this.reviewService.create(id, payload);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đánh giá (có phân trang)' })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'ID sản phẩm để lọc đánh giá',
  })
  @ApiQuery({
    name: 'rating',
    required: false,
    description: 'Lọc theo số sao đánh giá (1-5)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Trường để sắp xếp (createdAt, rating, updatedAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Thứ tự sắp xếp (asc, desc)',
  })
  @ApiQuery({
    name: 'currentPage',
    required: false,
    description: 'Trang hiện tại',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Số mục trên mỗi trang',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách đánh giá có phân trang',
    type: ReviewListResponseDto,
  })
  findAll(
    @Query() payload: ReviewFilterDto,
  ): Promise<ReviewListResponseDto> {
    return this.reviewService.findAll(payload);
  }

  @Get('user')
  @ApiOperation({
    summary: 'Lấy danh sách đánh giá của người dùng đang đăng nhập (có phân trang)',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'ID sản phẩm để lọc đánh giá',
  })
  @ApiQuery({
    name: 'rating',
    required: false,
    description: 'Lọc theo số sao đánh giá (1-5)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Trường để sắp xếp (createdAt, rating, updatedAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Thứ tự sắp xếp (asc, desc)',
  })
  @ApiQuery({
    name: 'currentPage',
    required: false,
    description: 'Trang hiện tại',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Số mục trên mỗi trang',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách đánh giá của người dùng có phân trang',
    type: ReviewListResponseDto,
  })
  findUserReviews(
    @Req() req: Request,
    @Query() payload: ReviewFilterDto
  ): Promise<ReviewListResponseDto> {
    const { id } = req['user'];
    return this.reviewService.findUserReviews(id, payload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một đánh giá' })
  @ApiParam({ name: 'id', description: 'ID của đánh giá' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin đánh giá',
    type: ReviewResponseDto,
  })
  findOne(@Param('id') id: string): Promise<ReviewResponseDto> {
    return this.reviewService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cập nhật đánh giá' })
  @ApiParam({ name: 'id', description: 'ID của đánh giá' })
  @ApiResponse({
    status: 200,
    description: 'Đánh giá đã được cập nhật',
    type: ReviewResponseDto,
  })
  update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() payload: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const { id: userId } = req['user'];
    return this.reviewService.update(id, userId, payload);
  }

  @Delete(':id')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa đánh giá' })
  @ApiParam({ name: 'id', description: 'ID của đánh giá' })
  @ApiResponse({ status: 200, description: 'Đánh giá đã được xóa' })
  remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const { id: userId } = req['user'];
    return this.reviewService.remove(id, userId);
  }
}
