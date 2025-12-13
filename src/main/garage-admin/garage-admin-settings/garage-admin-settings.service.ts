import { Injectable } from '@nestjs/common';
import { AppError } from 'src/common/error/handle-error.app';
import { PrismaService } from 'src/lib/prisma/prisma.service';

type NotificationField =
  | 'emailNotification'
  // | 'customerInquiryNotification'
  | 'productApprovalNotification';

@Injectable()
export class GarageAdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkUserExists(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async getNotificationSettings(userId: string) {
    console.log('UserId', userId);
    const settings = await this.prisma.garageAdminNotification.findUnique({
      where: { userId },
    });
    // console.log("Setting: ", settings);

    const inquiryNotification = await this.prisma.notificationToggle.findUnique(
      {
        where: { userId },
      },
    );
    console.log(inquiryNotification?.CustomerInquiryAlert);

    if (!settings) {
      return {
        emailNotification: false,
        customerInquiryNotification: inquiryNotification?.CustomerInquiryAlert,
        productApprovalNotification: false,
      };
    }

    return {
      emailNotification: settings.emailNotification,
      customerInquiryNotification: inquiryNotification?.CustomerInquiryAlert
        ? inquiryNotification?.CustomerInquiryAlert
        : false,
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

    const current = await this.prisma.garageAdminNotification.findUnique({
      where: { userId },
    });

    // ------------------ If exists -> toggle ------------------
    if (current) {
      const updated = await this.prisma.garageAdminNotification.update({
        where: { userId },
        data: { [field]: !current[field] },
      });

      // Return only the field you toggled
      return {
        [field]: updated[field],
      };
    }

    // ------------------ If not exists -> create ------------------
    const created = await this.prisma.garageAdminNotification.create({
      data: {
        user: { connect: { id: userId } },
        [field]: true,
      },
    });

    return {
      [field]: created[field],
    };
  }

  // Individual methods
  async updateEmailNotification(userId: string) {
    return this.toggleNotification(userId, 'emailNotification');
  }

  // async updateCustomerInquiryAlert(userId: string) {
  //   return this.toggleNotification(userId, 'customerInquiryNotification');
  // }

  async updateProductApprovalUpdate(userId: string) {
    return this.toggleNotification(userId, 'productApprovalNotification');
  }
  async toggleCustomerInquiryAlert(userId: string) {
    // 1. Get current notification setting
    let setting = await this.prisma.notificationToggle.findUnique({
      where: { userId },
    });

    // 2. If no setting, create a new one for this user
    if (!setting) {
      setting = await this.prisma.notificationToggle.create({
        data: {
          userId,
          // default values or your desired initial values
          CustomerInquiryAlert: false,
        },
      });
    }

    // 3. Toggle the value
    const newValue = !setting.CustomerInquiryAlert;

    // 4. Update toggled value
    const updated = await this.prisma.notificationToggle.update({
      where: { userId },
      data: {
        CustomerInquiryAlert: newValue,
      },
    });

    return { CustomerInquiryAlert: updated.CustomerInquiryAlert };
  }
}
