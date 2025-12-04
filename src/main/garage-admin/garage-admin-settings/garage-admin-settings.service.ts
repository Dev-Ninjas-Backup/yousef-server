import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class GarageAdminSettingsService {
  constructor(private readonly prismaService: PrismaService) { }

  // update email notifications
  async emailNotification() {
    return 'Email Notifications API is working...';
  }

  async customerInquiryAlert() {
    return 'Customer Inquiry Alert API is working...';
  }

  async productApprovalUpdate() {
    return 'Product Approval Update API is working...';
  }
}

