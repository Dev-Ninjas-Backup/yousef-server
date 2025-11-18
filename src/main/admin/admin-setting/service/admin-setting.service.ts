import { Injectable } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { UpdateAdminSettingDto } from '../dto/update-admin-setting.dto';

@Injectable()
export class AdminSettingService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------auto approve garages-------------

  @HandleError('failed to auto approve garages')
  async autoApprovalSettingGarage() {
    const updated = await this.prisma.user.updateMany({
      where: {
        role: 'GARAGE_OWNER',
        garageStatus: 'PENDING',
        isGarageVerified: false,
      },
      data: {
        garageStatus: 'APPROVE',
        isGarageVerified: true,
      },
    });

    return {
      success: true,
      message: `${updated.count} garages auto-approved.`,
    };
  }

  // ---------- admin every user on of email notification ----
  @HandleError('Failed to update email notification for user')
  async updateEmailNotificationForUser(
    userId: string,
    isEmailNotification: boolean,
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isEmailNotification,
      },
      select: {
        id: true,
        email: true,
        isEmailNotification: true,
      },
    });

    return {
      success: true,
      message: `Email notification turned ${isEmailNotification ? 'ON' : 'OFF'} for user.`,
      data: user,
    };
  }

  findAll() {
    return `This action returns all adminSetting`;
  }

  findOne(id: number) {
    return `This action returns a #${id} adminSetting`;
  }

  update(id: number, updateAdminSettingDto: UpdateAdminSettingDto) {
    return `This action updates a #${id} adminSetting`;
  }

  remove(id: number) {
    return `This action removes a #${id} adminSetting`;
  }
}
