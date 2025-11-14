import { Injectable, NotFoundException } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { UtilsService } from 'src/lib/utils/utils.service';

import { AppError } from 'src/common/error/handle-error.app';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';

@Injectable()
export class AccountSettingService {
  constructor( private readonly prisma: PrismaService) {}

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
      data: { isEmailNotification: true },
    });

    return successResponse(
      updatedUser,
      `Email Notification has been ${
        updatedUser.isEmailNotification ? 'true' : 'disabled'
      } successfully.`,
    );
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
      data: { isSmsNotification: true },
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
      data: { isEmailPromotional: true },
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
}
