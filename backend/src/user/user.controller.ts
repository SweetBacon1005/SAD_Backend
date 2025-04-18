// src/user/user.controller.ts
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/role.decorator';
import { AddressDto } from './dto/address.dto';
import {
  AddressListResponseDto,
  AddressResponseDto,
} from './dto/address-response.dto';
import { ChangeRoleDto } from './dto/role.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import {
  ChangeRoleResponseDto,
  DeleteAddressResponseDto,
  DeleteUserResponseDto,
  ToggleActiveResponseDto,
  UserPaginationResponseDto,
  UserResponseDto,
} from './dto/response.dto';
import { UserService } from './user.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo người dùng mới (Admin)' })
  @ApiCreatedResponse({
    description: 'Người dùng đã được tạo thành công',
    type: UserResponseDto,
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Tìm kiếm người dùng (Admin/Manager)' })
  @ApiOkResponse({
    description: 'Danh sách người dùng',
    type: UserPaginationResponseDto,
  })
  async getAllUsers(
    @Query() searchUserDto: SearchUserDto,
  ): Promise<UserPaginationResponseDto> {
    return this.userService.searchUsers(searchUserDto);
  }

  @Get('profile/me')
  @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
  @ApiOkResponse({
    description: 'Thông tin người dùng',
    type: UserResponseDto,
  })
  async getCurrentUserProfile(
    @Request() req: Request,
  ): Promise<UserResponseDto> {
    const { id } = req['user'];
    return this.userService.findUserById(id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiParam({ name: 'id', description: 'ID người dùng' })
  @ApiOkResponse({
    description: 'Thông tin người dùng',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền xem thông tin người dùng khác',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người dùng',
  })
  async getUserById(
    @Param('id') id: string,
    @Request() req: Request,
  ): Promise<UserResponseDto> {
    const { id: userId, role } = req['user'];

    // Check if user is admin or manager, or if they're trying to access their own profile
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && userId !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }

    const user = await this.userService.findUserById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiParam({ name: 'id', description: 'ID người dùng' })
  @ApiOkResponse({
    description: 'Thông tin người dùng đã cập nhật',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền cập nhật thông tin người dùng khác',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: Request,
  ): Promise<UserResponseDto> {
    const { id: userId, role } = req['user'];

    // Check if user is admin/manager or if they're trying to update their own profile
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && userId !== id) {
      throw new ForbiddenException('You can only update your own user data');
    }

    // Only admin can change user roles
    if (updateUserDto.role && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can change user roles');
    }

    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa người dùng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID người dùng' })
  @ApiOkResponse({
    description: 'Người dùng đã được xóa thành công',
    type: DeleteUserResponseDto,
  })
  async deleteUser(@Param('id') id: string): Promise<DeleteUserResponseDto> {
    await this.userService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Thay đổi vai trò người dùng (Admin)' })
  @ApiParam({ name: 'id', description: 'ID người dùng' })
  @ApiOkResponse({
    description: 'Vai trò người dùng đã được cập nhật',
    type: ChangeRoleResponseDto,
  })
  async changeUserRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
  ): Promise<ChangeRoleResponseDto> {
    return this.userService.changeUserRole(id, changeRoleDto.role);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Thay đổi trạng thái hoạt động của người dùng (Admin)',
  })
  @ApiParam({ name: 'id', description: 'ID người dùng' })
  @ApiOkResponse({
    description: 'Trạng thái hoạt động đã được cập nhật',
    type: ToggleActiveResponseDto,
  })
  async toggleUserActive(
    @Param('id') id: string,
  ): Promise<ToggleActiveResponseDto> {
    return this.userService.toggleUserActive(id);
  }

  // Address endpoints
  @Get(':userId/addresses')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Lấy danh sách địa chỉ của người dùng' })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiOkResponse({
    description: 'Danh sách địa chỉ',
    type: [AddressResponseDto],
  })
  async getUserAddresses(
    @Param('userId') userId: string,
    @Request() req: Request,
  ): Promise<AddressResponseDto[]> {
    const { id, role } = req['user'];
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && id !== userId) {
      throw new ForbiddenException('You can only access your own addresses');
    }

    return this.userService.getUserAddresses(userId);
  }

  @Post(':userId/addresses')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Thêm địa chỉ mới cho người dùng' })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiCreatedResponse({
    description: 'Địa chỉ đã được thêm thành công',
    type: AddressResponseDto,
  })
  async addAddress(
    @Param('userId') userId: string,
    @Body() addressDto: AddressDto,
    @Request() req: Request,
  ): Promise<AddressResponseDto> {
    const { id, role } = req['user'];
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && id !== userId) {
      throw new ForbiddenException(
        'You can only add addresses to your own account',
      );
    }

    return this.userService.addAddress(userId, addressDto);
  }

  @Patch(':userId/addresses/:addressId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cập nhật địa chỉ của người dùng' })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiParam({ name: 'addressId', description: 'ID địa chỉ' })
  @ApiOkResponse({
    description: 'Địa chỉ đã được cập nhật thành công',
    type: AddressResponseDto,
  })
  async updateAddress(
    @Param('userId') userId: string,
    @Param('addressId') addressId: string,
    @Body() addressDto: AddressDto,
    @Request() req: Request,
  ): Promise<AddressResponseDto> {
    const { id, role } = req['user'];
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && id !== userId) {
      throw new ForbiddenException('You can only update your own addresses');
    }

    return this.userService.updateAddress(userId, addressId, addressDto);
  }

  @Delete(':userId/addresses/:addressId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa địa chỉ của người dùng' })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiParam({ name: 'addressId', description: 'ID địa chỉ' })
  @ApiOkResponse({
    description: 'Địa chỉ đã được xóa thành công',
    type: DeleteAddressResponseDto,
  })
  async deleteAddress(
    @Param('userId') userId: string,
    @Param('addressId') addressId: string,
    @Request() req: Request,
  ): Promise<DeleteAddressResponseDto> {
    // Check if user is admin/manager or if they're trying to delete their own address
    const { id, role } = req['user'];
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && id !== userId) {
      throw new ForbiddenException('You can only delete your own addresses');
    }

    await this.userService.deleteAddress(userId, addressId);
    return { message: 'Address deleted successfully' };
  }

  @Patch(':userId/addresses/:addressId/set-default')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Đặt địa chỉ mặc định cho người dùng' })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiParam({ name: 'addressId', description: 'ID địa chỉ' })
  @ApiOkResponse({
    description: 'Địa chỉ đã được đặt làm mặc định',
    type: AddressResponseDto,
  })
  async setDefaultAddress(
    @Param('userId') userId: string,
    @Param('addressId') addressId: string,
    @Request() req: Request,
  ): Promise<AddressResponseDto> {
    // Check if user is admin/manager or if they're trying to update their own address
    const { id, role } = req['user'];
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && id !== userId) {
      throw new ForbiddenException(
        'You can only set default for your own addresses',
      );
    }

    return this.userService.setDefaultAddress(userId, addressId);
  }

  @Get(':userId/addresses/default')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Lấy địa chỉ mặc định của người dùng' })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiOkResponse({
    description: 'Địa chỉ mặc định',
    type: AddressResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy địa chỉ mặc định',
  })
  async getDefaultAddress(
    @Param('userId') userId: string,
    @Request() req: Request,
  ): Promise<AddressResponseDto> {
    // Check if user is admin/manager or if they're trying to get their own default address
    const { id, role } = req['user'];
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && id !== userId) {
      throw new ForbiddenException(
        'You can only access your own default address',
      );
    }

    return this.userService.getDefaultAddress(userId);
  }
}
