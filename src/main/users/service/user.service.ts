import { Injectable, NotFoundException } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';

import { FileService } from 'src/lib/file/file.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { UtilsService } from 'src/lib/utils/utils.service';

import { UpdateProfileDto } from '../dto/update.profile.dto';
import { UpdatePasswordDto } from '../dto/updatepassword.dto';

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
    private readonly fileService: FileService,
  ) {}

  // ------------------------- Update Password -----------------
  @HandleError('Failed to update password', 'User')
  async updatePassword(
    userid: string,
    dto: UpdatePasswordDto,
  ): Promise<TResponse<any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userid },
      select: {
        id: true,
        email: true,
        fullName: true,
        profilePhoto: true,
        password: true,
        googleId: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // If user registered via Google only (no password set yet)
    if (!user.password) {
      const hashedPassword = await this.utils.hash(dto.newPassword);

      const updatedUser = await this.prisma.user.update({
        where: { id: userid },
        data: { password: hashedPassword },
        select: { id: true, email: true, fullName: true, profilePhoto: true },
      });

      return successResponse(updatedUser, 'Password set successfully');
    }

    // For normal email/password users — require current password check
    if (!dto.currentPassword) {
      throw new AppError(400, 'Current password is required');
    }

    const isPasswordValid = await this.utils.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new AppError(400, 'Invalid current password');
    }

    const hashedPassword = await this.utils.hash(dto.newPassword);

    const updatedUser = await this.prisma.user.update({
      where: { id: userid },
      data: { password: hashedPassword },
      select: { id: true, email: true, fullName: true, profilePhoto: true },
    });

    return successResponse(updatedUser, 'Password updated successfully');
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
      },
    });

    return successResponse(updatedUser, 'User profile updated successfully');
  }

  // ------------------------- Get Profile -----------------
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) throw new AppError(404, 'User not found');

    return successResponse(user, 'User profile retrieved successfully');
  }

  @HandleError('Failed to get all users', 'User')
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
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

  @HandleError('USER can be chnageReviewAlert user')
  async changeReviewAlert(userId: string) {
    // Find user by ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Toggle ReviewAlerts flag
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { ReviewAlerts: !user.ReviewAlerts },
    });

    return successResponse(
      updatedUser,
      `Review Alert has been ${updatedUser.ReviewAlerts ? 'enabled' : 'disabled'} successfully.`,
    );
  }
}
