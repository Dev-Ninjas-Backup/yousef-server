import { Injectable } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';

import { PrismaService } from 'src/lib/prisma/prisma.service';
import { UtilsService } from 'src/lib/utils/utils.service';

import { UpdateProfileDto } from '../dto/update.profile.dto';

import { AppError } from 'src/common/error/handle-error.app';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
  ) {}

  // ------------------------- Get All Users -----------------

  @HandleError('Failed to get all users', 'User')
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      where: { isVerified: true },
      select: {
        id: true,
        role: true,
        fullName: true,
        profilePhoto: true,
        bio: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return successResponse(users, 'All users retrieved successfully');
  }

  // ------------------------- Get Profile -----------------
  @HandleError('Failed to get profile', 'Profile')
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        garages: true,
      },
    });

    if (!user) throw new AppError(404, 'User not found');

    delete (user as any).password;

    return successResponse(user, 'User profile retrieved successfully');
  }

  // ----------------- update user profile ---------

  @HandleError('Failed to update profile', 'Profile')
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    s3Result?: { url: string; key: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName?.trim() || user.fullName,
        bio: dto.bio?.trim() || user.bio,
        profilePhoto: s3Result?.url || user.profilePhoto,
        updatedAt: new Date(),
        phone: dto.phoneNumber?.trim() || user.phone,
        address: dto.address?.trim() || user.address,
        city: dto.city?.trim() || user.city,
        emirate: dto.emirate?.trim() || user.emirate,
        userLat: dto.userLat?.trim() || user.userLat,
        userLng: dto.userLng?.trim() || user.userLng,
      },
      select: {
        id: true,
        role: true,
        fullName: true,
        profilePhoto: true,
        bio: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        emirate: true,
        userLat: true,
        userLng: true,
        createdAt: true,
        updatedAt: true,
        serviceCategories: true,
      },
    });

    return successResponse(updatedUser, 'User profile updated successfully');
  }

  // ------------------hardDeleteUserAccount-------------
  @HandleError('Failed to delete user account', 'User')
  async hardDeleteUserAccount(userId: string): Promise<TResponse<any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return successResponse(null, 'User account deleted successfully');
  }

  // ------------------------- changeReviewAlert -----------------

  // @HandleError('USER can be chnageReviewAlert user')
  // async changeReviewAlert(userId: string) {
  //   // Find user by ID
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //   });

  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }

  //   // ---------------- Toggle ReviewAlerts flag ---------------------
  //   const updatedUser = await this.prisma.user.update({
  //     where: { id: userId },
  //     data: { ReviewAlerts: !user.ReviewAlerts },
  //   });

  //   return successResponse(
  //     updatedUser,
  //     `Review Alert has been ${updatedUser.ReviewAlerts ? 'enabled' : 'disabled'} successfully.`,
  //   );
  // }

  // ----------testEmail-------------------
  @HandleError('Failed to test user email', 'User')
  async testEmail(userId: string): Promise<TResponse<any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // For testing purposes, just return the user's email
    return successResponse(
      { email: user.email },
      'User email retrieved successfully',
    );
  }
}
