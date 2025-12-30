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

  // ----------------------- autoApprovalSettingGarage -------------
  //  @HandleError('failed to auto approve garages')
  //   async autoApprovalSettingGarage() {
  //     // ---------------- Get all PENDING garages------------------
  //     const garages = await this.prisma.user.findMany({
  //       where: {
  //         role: 'GARAGE_OWNER',
  //         garageStatus: 'PENDING',
  //         isGarageVerified: false,
  //       },
  //     });

  //     let approvedCount = 0;

  //     // -----------Approve each manually-----------------
  //     for (const garage of garages) {
  //       const updateData: any = {
  //         garageStatus: 'APPROVE',
  //         isGarageVerified: true,
  //       };

  //       // --- Add trial logic-------------------
  //       if (!garage.isTrialActive) {
  //         const trialStart = new Date();
  //         const trialEnd = new Date();
  //         trialEnd.setMonth(trialEnd.getMonth() + 2);

  //         updateData.trialStartDate = trialStart;
  //         updateData.trialEndDate = trialEnd;
  //         updateData.isTrialActive = true;
  //         updateData.isSubscriptionTrialActive = true;
  //         updateData.subscriptionTrialStartDate = trialStart;
  //         updateData.subscriptionTrialEndDate = trialEnd;
  //       }

  //       // --------------- Update--------------
  //       await this.prisma.user.update({
  //         where: { id: garage.id },
  //         data: updateData,
  //       });

  //       approvedCount++;
  //     }

  //     // -----------Toggle the auto-approval garage setting-------------
  //     let setting = await this.prisma.generalSetting.findFirst();

  //     if (!setting) {
  //       setting = await this.prisma.generalSetting.create({
  //         data: {
  //           isAutoApproveGarages: true,
  //         },
  //       });
  //     } else {
  //       setting = await this.prisma.generalSetting.update({
  //         where: { id: setting.id },
  //         data: {
  //           isAutoApproveGarages: !setting.isAutoApproveGarages,
  //         },
  //       });
  //     }
  //     return {
  //       success: true,
  //       message: `${approvedCount} garages auto-approved.`,

  //     };
  //   }

  @HandleError('failed to auto approve garages')
  async autoApprovalSettingGarage() {
    // ------------------------------------------------------------------
    // Fetch all pending garages that require approval
    // ------------------------------------------------------------------
    const garages = await this.prisma.user.findMany({
      where: {
        role: 'GARAGE_OWNER',
        garageStatus: 'PENDING',
        isGarageVerified: false,
      },
    });

    let approvedCount = 0;

    // ------------------------------------------------------------------
    // Approve each pending garage and activate trial if not already active
    // ------------------------------------------------------------------
    for (const garage of garages) {
      const updateData: any = {
        garageStatus: 'APPROVE',
        isGarageVerified: true,
      };

      // --- Activate 2-month trial if the garage has no active trial ---
      if (!garage.isTrialActive) {
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setMonth(trialEnd.getMonth() + 2);

        updateData.trialStartDate = trialStart;
        updateData.trialEndDate = trialEnd;
        updateData.isTrialActive = true;
        updateData.isSubscriptionTrialActive = true;
        updateData.subscriptionTrialStartDate = trialStart;
        updateData.subscriptionTrialEndDate = trialEnd;
      }

      // --- Update the garage owner record ---
      await this.prisma.user.update({
        where: { id: garage.id },
        data: updateData,
      });

      approvedCount++;
    }

    // ------------------------------------------------------------------
    // Toggle the global auto-approve garages setting
    // (Enables/disables automatic approval for future garage registrations)
    // ------------------------------------------------------------------
    let setting = await this.prisma.generalSetting.findFirst();

    if (!setting) {
      // Create setting with auto-approve enabled if it doesn't exist
      setting = await this.prisma.generalSetting.create({
        data: {
          isAutoApproveGarages: true,
        },
      });
    } else {
      // Toggle the current value
      setting = await this.prisma.generalSetting.update({
        where: { id: setting.id },
        data: {
          isAutoApproveGarages: !setting.isAutoApproveGarages,
        },
      });
    }

    // ------------------------------------------------------------------
    // Return success response with count of approved garages
    // ------------------------------------------------------------------
    return {
      success: true,
      message: `${approvedCount} garages auto-approved and setting toggled.`,
    };
  }

  // ---------- admin every user on of email notification ----
  // @HandleError('Failed to update email notification for user setting')
  // async updateEmailNotificationForUser(isEmailNotification: boolean) {
  //   const user = await this.prisma.user.updateMany({
  //     where: {
  //       isDeleted: false,
  //     },
  //     data: {
  //       isEmailNotification: true,
  //     },
  //   });

  //     let setting = await this.prisma.generalSetting.findFirst();

  //   if (!setting) {
  //     setting = await this.prisma.generalSetting.create({
  //       data: {
  //         isEmailNotificationEnabled: false,
  //       },
  //     });
  //   } else {
  //     setting = await this.prisma.generalSetting.update({
  //       where: { id: setting.id },
  //       data: {
  //         isEmailNotificationEnabled: !setting.isEmailNotificationEnabled,
  //       },
  //     });
  //   }

  //   // Update all users based on the toggle
  //   await this.prisma.user.updateMany({
  //     where: {
  //       isDeleted: false,
  //     },
  //     data: {
  //       isEmailNotification: setting.isEmailNotificationEnabled,
  //     },
  //   });
  //   return {
  //     success: true,
  //     message: `Email notification turned ${isEmailNotification ? 'ON' : 'OFF'} for user.`,
  //     data: user,
  //   };
  // }

  @HandleError('Failed to update email notification for user setting')
  async updateEmailNotificationForUser(isEmailNotification: boolean) {
    // ------------------------------------------------------------------
    // Force-set email notification preference for all active users
    // (This overrides individual user preferences)
    // ------------------------------------------------------------------
    const user = await this.prisma.user.updateMany({
      where: {
        isDeleted: false,
      },
      data: {
        isEmailNotification: true,
      },
    });

    // ------------------------------------------------------------------
    // Toggle the global email notification enabled setting
    // ------------------------------------------------------------------
    let setting = await this.prisma.generalSetting.findFirst();

    if (!setting) {
      // Create the setting with opposite value if it doesn't exist
      setting = await this.prisma.generalSetting.create({
        data: {
          isEmailNotificationEnabled: false,
        },
      });
    } else {
      // Toggle the current global setting
      setting = await this.prisma.generalSetting.update({
        where: { id: setting.id },
        data: {
          isEmailNotificationEnabled: !setting.isEmailNotificationEnabled,
        },
      });
    }

    // ------------------------------------------------------------------
    // Sync all active users' email notification preference
    // to match the new global setting value
    // ------------------------------------------------------------------
    await this.prisma.user.updateMany({
      where: {
        isDeleted: false,
      },
      data: {
        isEmailNotification: setting.isEmailNotificationEnabled,
      },
    });

    // ------------------------------------------------------------------
    // Return success response
    // ------------------------------------------------------------------
    return {
      success: true,
      message: `Email notification turned ${isEmailNotification ? 'ON' : 'OFF'} for user.`,
      data: user,
    };
  }
  // -----------auto approve autoupdateApprovalSettingParts-------------

  // @HandleError('failed to auto approve autoupdateApprovalSettingParts')
  // async autoupdateApprovalSettingParts() {
  //   const updated = await this.prisma.product.updateMany({
  //     where: {
  //       status: 'PENDING',
  //     },
  //     data: {
  //       status: 'APPROVED',
  //     },
  //   });

  //   let setting = await this.prisma.generalSetting.findFirst();

  //   if (!setting) {
  //     setting = await this.prisma.generalSetting.create({
  //       data: {
  //         isAutoApproveParts: true,
  //       },
  //     });
  //   } else {
  //     setting = await this.prisma.generalSetting.update({
  //       where: { id: setting.id },
  //       data: {
  //         isAutoApproveParts: !setting.isAutoApproveParts,
  //       },
  //     });
  //   }
  //   return {
  //     success: true,
  //     message: `${updated.count} products parts were auto-approved.`,
  //   };
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} adminSetting`;
  // }

  @HandleError('failed to auto approve autoupdateApprovalSettingParts')
  async autoupdateApprovalSettingParts() {
    // ------------------------------------------------------------------
    // Mass-approve all pending parts/products
    // ------------------------------------------------------------------
    const updated = await this.prisma.product.updateMany({
      where: {
        status: 'PENDING',
      },
      data: {
        status: 'APPROVED',
      },
    });

    // ------------------------------------------------------------------
    // Toggle the global auto-approve parts setting
    // (Controls automatic approval for future part listings)
    // ------------------------------------------------------------------
    let setting = await this.prisma.generalSetting.findFirst();

    if (!setting) {
      // Create the setting with auto-approve enabled if it doesn't exist
      setting = await this.prisma.generalSetting.create({
        data: {
          isAutoApproveParts: true,
        },
      });
    } else {
      // Toggle the current value
      setting = await this.prisma.generalSetting.update({
        where: { id: setting.id },
        data: {
          isAutoApproveParts: !setting.isAutoApproveParts,
        },
      });
    }

    // ------------------------------------------------------------------
    // Return success response with count of approved parts
    // ------------------------------------------------------------------
    return {
      success: true,
      message: `${updated.count} product parts were auto-approved and setting toggled.`,
    };
  }

  // @HandleError('Failed to get auto approve garages toggle')
  // async getAutoApproveGaragesToggle() {
  //   const setting = await this.prisma.generalSetting.findFirst();

  //   return successResponse(
  //     {
  //       isEnabled: setting?.isAutoApproveGarages ?? false,
  //     },
  //     'Auto approve garages toggle retrieved successfully',
  //   );
  // }

  // ---------- get email notification toggle ----
  // @HandleError('Failed to get email notification toggle')
  // async getEmailNotificationToggle() {
  //   const setting = await this.prisma.generalSetting.findFirst();

  //   return successResponse(
  //     {
  //       isEnabled: setting?.isEmailNotificationEnabled ?? true,
  //     },
  //     'Email notification toggle retrieved successfully',
  //   );
  // }

  // -----------get auto approval parts toggle-------------
  @HandleError('Failed to get auto approval parts toggle')
  async getAutoApprovalPartsToggle() {
    const setting = await this.prisma.generalSetting.findFirst();

    return successResponse(
      {
        isEnabled: setting?.isAutoApproveParts ?? false,
      },
      'Auto approval parts toggle retrieved successfully',
    );
  }

  // -----------get auto approve garages toggle status-------------

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

  // -------------GetApprovalSettings ----------------
  @HandleError(
    'Failed to get approval settings like auto-approval parts toggle and email notification toggle',
  )
  async GetApprovalSettings() {
    const setting = await this.prisma.generalSetting.findFirst();

    return successResponse(
      {
        isAutoApproveParts: setting?.isAutoApproveParts ?? false,
        isAutoApproveGarages: setting?.isAutoApproveGarages ?? false,
        isEmailNotificationEnabled: setting?.isEmailNotificationEnabled ?? true,
      },
      'Approval settings retrieved successfully',
    );
  }
}
