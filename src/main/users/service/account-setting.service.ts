import { Injectable, NotFoundException } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { PrismaService } from 'src/lib/prisma/prisma.service';

import * as bcrypt from 'bcrypt';
import { AppError } from 'src/common/error/handle-error.app';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';
import { UpdatePasswordDto } from '../dto/updatepassword.dto';

@Injectable()
export class AccountSettingService {
  constructor(private readonly prisma: PrismaService) {}

  //----------------- chnageReviewAlert----

  // @HandleError('USER can be chnageReviewAlert user')
  // async changeReviewAlert(userId: string) {
  //   // Find user by ID
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //   });

  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }

  //   // Toggle ReviewAlerts flag
  //   const updatedUser = await this.prisma.user.update({
  //     where: { id: userId },
  //     data: { ReviewAlerts: !user.ReviewAlerts },
  //   });

  //   return successResponse(
  //     updatedUser,
  //     `Review Alert has been ${updatedUser.ReviewAlerts ? 'enabled' : 'disabled'} successfully.`,
  //   );
  // }

  // Get all notifications
  async getAllNotifications(userId: string): Promise<TResponse<any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isEmailNotification: true,
        isSmsNotification: true,
        isEmailPromotional: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return successResponse(user, 'Notifications retrieved successfully');
  }

  //----------------- changeEmailNotification----

  @HandleError('Failed to change email notification', 'Email Notification')
  async changeEmailNotification(userId: string) {
    // Find user by ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Toggle EmailNotification flag
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isEmailNotification: !user.isEmailNotification },
      select: { isEmailNotification: true },
    });

    return successResponse(
      updatedUser,
      `Email Notification has been ${
        updatedUser.isEmailNotification ? 'true' : 'false'
      } successfully.`,
    );
  }

  //   -------------------- changeSmsNotification-------------------
  @HandleError('Failed to change sms notification', 'Sms Notification')
  async changeSmsNotification(userId: string) {
    // ---------------- Find user by ID---------------------
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ------------ Toggle SmsNotification flag ------------------
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isSmsNotification: !user.isSmsNotification },
      select: {
        isSmsNotification: true,
      },
    });

    return successResponse(
      updatedUser,
      `Sms Notification has been ${
        updatedUser.isSmsNotification ? 'true' : 'false'
      } successfully.`,
    );
  }

  //   -----------------------  changeEmailPromotional----------
  @HandleError('Failed to change email promotional', 'Email Promotional')
  async changeEmailPromotional(userId: string) {
    // Find user by ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Toggle EmailPromotional flag
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isEmailPromotional: !user.isEmailPromotional },
      select: { isEmailPromotional: true },
    });

    return successResponse(
      updatedUser,
      `Email Promotional has been ${
        updatedUser.isEmailPromotional ? 'true' : 'false'
      } successfully.`,
    );
  }

  //   ------------deleteUser---------------
  @HandleError('Failed to delete user', 'User')
  async deleteUser(userId: string): Promise<TResponse<any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isDeleted: true },
    });

    return successResponse(null, 'User deleted successfully');
  }

  // ------------------changePassword-------------------

  @HandleError('Failed to change password', 'Password')
  async changePassword(
    userId: string,
    dto: UpdatePasswordDto,
  ): Promise<TResponse<any>> {
    const { currentPassword, newPassword } = dto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.password) {
      throw new AppError(400, 'No password set. Please use password reset.');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError(400, 'Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return successResponse(null, 'Password changed successfully');
  }
}
