import { Injectable, NotFoundException } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { successResponse } from 'src/common/utilsResponse/response.util';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { GeneralSettingDtoPlatform } from '../dto/platform.setting.dto';
import { UpdatePaymentConfigureDto } from '../dto/update-payment-configure.dto';

@Injectable()
export class AdminSettingService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------platform setting create----
  @HandleError('Failed to create or update platform setting')
  async createOrUpdatePlatformSetting(dto: GeneralSettingDtoPlatform) {
    // ------------Check if a settings row already exists-------------
    let platformSetting = await this.prisma.generalSetting.findFirst();

    if (platformSetting) {
      platformSetting = await this.prisma.generalSetting.update({
        where: { id: platformSetting.id },
        data: {
          platformName: dto.platformName,
          supportEmail: dto.supportEmail,
          PlatformDescription: dto.PlatformDescription,
        },
      });
    } else {
      platformSetting = await this.prisma.generalSetting.create({
        data: {
          platformName: dto.platformName,
          supportEmail: dto.supportEmail,
          PlatformDescription: dto.PlatformDescription,
        },
      });
    }

    return successResponse(
      platformSetting,
      'Platform setting saved successfully',
    );
  }

  // -----------------------get platform fee for user -----------
  @HandleError('Failed to get platform fee for user')
  async getPlatformSetting() {
    const getplatform = await this.prisma.generalSetting.findFirst();

    return successResponse(
      getplatform ?? {
        platformName: '',
        supportEmail: '',
        PlatformDescription: '',
      },
      'Platform fee retrieved successfully',
    );
  }

  // -----------auto approve garages-------------

  @HandleError('failed to auto approve garages')
  async autoApprovalSettingGarage() {
    // ---------------- Get all PENDING garages------------------
    const garages = await this.prisma.user.findMany({
      where: {
        role: 'GARAGE_OWNER',
        garageStatus: 'PENDING',
        isGarageVerified: false,
      },
    });

    let approvedCount = 0;

    // -----------Approve each manually-----------------
    for (const garage of garages) {
      const updateData: any = {
        garageStatus: 'APPROVE',
        isGarageVerified: true,
      };

      // --- Add trial logic-------------------
      if (!garage.isTrialActive) {
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setMonth(trialEnd.getMonth() + 2);
        // trialStartDate: trialStart,
        //         trialEndDate: trialEnd,
        //         isTrialActive: true,
        //         isSubscriptionTrialActive: true,
        //         subscriptionTrialStartDate: trialStart,
        //         subscriptionTrialEndDate: trialEnd,
        updateData.trialStartDate = trialStart;
        updateData.trialEndDate = trialEnd;
        updateData.isTrialActive = true;
        updateData.isSubscriptionTrialActive = true;
        updateData.subscriptionTrialStartDate = trialStart;
        updateData.subscriptionTrialEndDate = trialEnd;
      }

      // --------------- Update--------------
      await this.prisma.user.update({
        where: { id: garage.id },
        data: updateData,
      });

      approvedCount++;
    }

    return {
      success: true,
      message: `${approvedCount} garages auto-approved.`,
    };
  }

  // ---------- admin every user on of email notification ----
  @HandleError('Failed to update email notification for user setting')
  async updateEmailNotificationForUser(isEmailNotification: boolean) {
    const user = await this.prisma.user.updateMany({
      where: {
        isDeleted: false,
      },
      data: {
        isEmailNotification: true,
      },
    });

    return {
      success: true,
      message: `Email notification turned ${isEmailNotification ? 'ON' : 'OFF'} for user.`,
      data: user,
    };
  }

  // // -----------auto approve autoupdateApprovalSettingParts-------------

  @HandleError('failed to auto approve autoupdateApprovalSettingParts')
  async autoupdateApprovalSettingParts() {
    const updated = await this.prisma.product.updateMany({
      where: {
        status: 'PENDING',
      },
      data: {
        status: 'APPROVED',
      },
    });

    return {
      success: true,
      message: `${updated.count} products parts were auto-approved.`,
    };
  }

  remove(id: number) {
    return `This action removes a #${id} adminSetting`;
  }

  // ------------updateFreePromotionProductListing------------

  // -----------------getPaymentConfig ----------------
  @HandleError('Failed to get payment config')
  async getPaymentConfig() {
    const getpaymentConfig = await this.prisma.paymentConfigure.findFirst();
    return successResponse(
      getpaymentConfig,
      'Payment config retrieved successfully',
    );
  }

  // ----------------------update updatePaymentConfig ---------------
  @HandleError('Failed to update payment config')
  async updatePaymentConfig(dto: UpdatePaymentConfigureDto) {
    const existing = await this.prisma.paymentConfigure.findFirst();

    if (!existing) {
      throw new NotFoundException('Payment configure not found');
    }

    const updated = await this.prisma.paymentConfigure.update({
      where: { id: existing.id },
      data: dto,
    });

    return successResponse(
      { Udated: updated },
      'Payment config updated successfully',
    );
  }

  // ------------------updateFreePromotionalListingStatus------------------
  @HandleError('Failed to update free promotional listing status')
  async updateFreePromotionalListingStatus() {
    const existing = await this.prisma.paymentConfigure.findFirst();

    if (!existing) {
      throw new NotFoundException('Payment configure not found');
    }

    const newStatus = !existing.freePromotionalListingStatus;

    await this.prisma.paymentConfigure.update({
      where: { id: existing.id },
      data: {
        freePromotionalListingStatus: newStatus,
      },
    });

    return successResponse(
      { status: newStatus },
      `Free promotional listing status changed`,
    );
  }
}
