// src/user/user.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User, UserRole, Prisma } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AddressDto } from './dto/address.dto';
import { SearchUserDto } from './dto/search-user.dto';
import * as bcrypt from 'bcrypt';

// Định nghĩa type an toàn cho user
type UserWithoutPassword = Omit<User, 'password' | 
  'emailVerificationOTP' | 
  'emailVerificationOTPExpires' | 
  'passwordResetOTP' | 
  'passwordResetOTPExpires'
>;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // User Management
  async createUser(data: CreateUserDto): Promise<UserWithoutPassword> {
    try {
      // Check if user with email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create the user
      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });

      // Return user without password
      const { password, emailVerificationOTP, emailVerificationOTPExpires, 
        passwordResetOTP, passwordResetOTPExpires, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  async searchUsers(searchUserDto: SearchUserDto) {
    const { currentPage = 1, pageSize = 10, query, role, isActive } = searchUserDto;
    const skip = (currentPage - 1) * pageSize;
    
    const where: Prisma.UserWhereInput = {};
    
    if (role) {
      where.role = role;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
          addresses: true,
          // Exclude sensitive fields
          password: false,
          emailVerificationOTP: false,
          emailVerificationOTPExpires: false,
          passwordResetOTP: false,
          passwordResetOTPExpires: false,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    
    return {
      data: users,
      pagination: {
        total,
        pageSize,
        currentPage,
        totalPages: Math.ceil(total / pageSize),
        hasMore: currentPage < Math.ceil(total / pageSize),
      },
    };
  }

  async findAllUsers(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<UserWithoutPassword[]> {
    const { skip, take, where, orderBy } = params;
    const users = await this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
      },
    });
    
    return users as unknown as UserWithoutPassword[];
  }

  async findUserById(id: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
        // Exclude sensitive fields
        password: false,
        emailVerificationOTP: false,
        emailVerificationOTPExpires: false,
        passwordResetOTP: false,
        passwordResetOTPExpires: false,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user as unknown as UserWithoutPassword;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        addresses: true,
      },
    });
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<UserWithoutPassword> {
    try {
      // If email is being changed, check if it's already in use
      if (data.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser && existingUser.id !== id) {
          throw new ConflictException('Email already in use');
        }
      }

      // If password is being updated, hash it
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      const user = await this.prisma.user.update({
        where: { id },
        data,
      });

      // Return user without password
      const { password, emailVerificationOTP, emailVerificationOTPExpires, 
        passwordResetOTP, passwordResetOTPExpires, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  async changeUserRole(id: string, role: UserRole): Promise<UserWithoutPassword> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { role },
      });

      // Return user without password
      const { password, emailVerificationOTP, emailVerificationOTPExpires, 
        passwordResetOTP, passwordResetOTPExpires, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw new Error(`Error changing user role: ${error.message}`);
    }
  }

  async toggleUserActive(id: string): Promise<UserWithoutPassword> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { isActive: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
      });

      // Return user without password
      const { password, emailVerificationOTP, emailVerificationOTPExpires, 
        passwordResetOTP, passwordResetOTPExpires, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error toggling user active status: ${error.message}`);
    }
  }

  // Address Management
  async addAddress(userId: string, addressData: AddressDto): Promise<any> {
    try {
      // Check if this is the first address for the user
      const userAddresses = await this.prisma.address.findMany({
        where: { userId },
      });

      // If it's the first address, make it default
      const isDefault = userAddresses.length === 0 ? true : addressData.isDefault ?? false;

      // If setting this address as default, unset default for other addresses
      if (isDefault && userAddresses.length > 0) {
        await this.prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const address = await this.prisma.address.create({
        data: {
          ...addressData,
          isDefault,
          user: { connect: { id: userId } },
        },
      });

      return address;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      throw new Error(`Error adding address: ${error.message}`);
    }
  }

  async updateAddress(userId: string, addressId: string, addressData: AddressDto): Promise<any> {
    try {
      // Get address and check ownership
      const address = await this.prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${addressId} not found`);
      }

      if (address.userId !== userId) {
        throw new Error('Address does not belong to this user');
      }

      // If setting this address as default, unset default for other addresses
      if (addressData.isDefault) {
        await this.prisma.address.updateMany({
          where: { userId, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }

      const updatedAddress = await this.prisma.address.update({
        where: { id: addressId },
        data: addressData,
      });

      return updatedAddress;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error updating address: ${error.message}`);
    }
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    try {
      // Get address and check ownership
      const address = await this.prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${addressId} not found`);
      }

      if (address.userId !== userId) {
        throw new Error('Address does not belong to this user');
      }

      await this.prisma.address.delete({
        where: { id: addressId },
      });

      // If deleted address was default and user has other addresses, set a new default
      if (address.isDefault) {
        const anotherAddress = await this.prisma.address.findFirst({
          where: { userId },
        });

        if (anotherAddress) {
          await this.prisma.address.update({
            where: { id: anotherAddress.id },
            data: { isDefault: true },
          });
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error deleting address: ${error.message}`);
    }
  }

  async getUserAddresses(userId: string): Promise<any[]> {
    try {
      const addresses = await this.prisma.address.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' },
      });

      return addresses;
    } catch (error) {
      throw new Error(`Error fetching user addresses: ${error.message}`);
    }
  }

  async getDefaultAddress(userId: string): Promise<any> {
    try {
      const address = await this.prisma.address.findFirst({
        where: { userId, isDefault: true },
      });

      if (!address) {
        throw new NotFoundException(`No default address found for user with ID ${userId}`);
      }

      return address;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error fetching default address: ${error.message}`);
    }
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<any> {
    try {
      // Get address and check ownership
      const address = await this.prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${addressId} not found`);
      }

      if (address.userId !== userId) {
        throw new Error('Address does not belong to this user');
      }

      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      const updatedAddress = await this.prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });

      return updatedAddress;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error setting default address: ${error.message}`);
    }
  }
}