import { Injectable } from '@nestjs/common';
import { AppError } from 'src/common/error/handle-error.app';
import { PrismaService } from 'src/lib/prisma/prisma.service';

type NotificationField =
  | 'emailNotification'
  | 'customerInquiryNotification'
  | 'productApprovalNotification';

@Injectable()
export class GarageAdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkUserExists(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async getNotificationSettings(userId: string) {
    const settings = await this.prisma.garageAdminNotification.findUnique({
      where: { userId },
    });

    if (!settings) {
      return {
        emailNotification: false,
        customerInquiryNotification: false,
        productApprovalNotification: false,
      };
    }

    return {
      emailNotification: settings.emailNotification,
      customerInquiryNotification: settings.customerInquiryNotification,
      productApprovalNotification: settings.productApprovalNotification,
    };
  }

  async toggleNotification(userId: string, field: NotificationField) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    let current = await this.prisma.garageAdminNotification.findUnique({
      where: { userId },
    });

    if (current) {
      const result = await this.prisma.garageAdminNotification.update({
        where: { userId },
        data: { [field]: !current[field] },
      });
      return {
        emailNotification: result.emailNotification,
        customerInquiryNotification: result.customerInquiryNotification,
        productApprovalNotification: result.productApprovalNotification,
      };
    }

    // Create if not exists
    current = await this.prisma.garageAdminNotification.create({
      data: {
        user: { connect: { id: userId } },
        emailNotification: field === 'emailNotification',
        customerInquiryNotification: field === 'customerInquiryNotification',
        productApprovalNotification: field === 'productApprovalNotification',
      },
    });

    return {
      emailNotification: current.emailNotification,
      customerInquiryNotification: current.customerInquiryNotification,
      productApprovalNotification: current.productApprovalNotification,
    };
  }

  // Individual methods
  async updateEmailNotification(userId: string) {
    return this.toggleNotification(userId, 'emailNotification');
  }

  async updateCustomerInquiryAlert(userId: string) {
    return this.toggleNotification(userId, 'customerInquiryNotification');
  }

  async updateProductApprovalUpdate(userId: string) {
    return this.toggleNotification(userId, 'productApprovalNotification');
  }
}
