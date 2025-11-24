import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class OverviewService {
  constructor(private prisma: PrismaService) {}

  async getUserOverview(userId: string) {
    // Get total listings by the user
    const totalListings = await this.prisma.product.count({
      where: { createdById: userId },
    });

    // Get total Active listings
    const totalActiveListings = await this.prisma.product.count({
      where: { createdById: userId, status: 'APPROVED' },
    });

    // Get total Pending listings
    const totalPendingListings = await this.prisma.product.count({
      where: { createdById: userId, status: 'PENDING' },
    });

    // Get total inquiries (Fake data for demonstration)
    const totalInquiries = 'Implement inquiry counting logic here';

    return {
      totalListings,
      totalActiveListings,
      totalPendingListings,
      totalInquiries,
    };
  }

  // Performance summary
  async getPerformanceSummary(userId: string) {
    // Total views in the products listed by the user
    const totalViews = await this.prisma.product.aggregate({
      where: { createdById: userId },
      _sum: {
        views: true,
      },
    });

    // Inquiries with monthly (Fake data for demonstration)
    const monthlyInquiries = 'Implement monthly inquiries logic here';

    // conversation rate, avg response time can be added similarly
    const conversationRate = 'Implement conversation rate logic here';

    return {
      totalViews,
      monthlyInquiries,
      conversationRate,
    };
  }

  // Recent activity only product listings & promotional ads (Pending & Approved)
  // async getRecentActivity(userId: string) {
  //     const recentProductRequest = await this.prisma.product.findMany({
  //         where: { createdById: userId },
  //         orderBy: { createdAt: 'desc' },
  //         take: 1,
  //     });

  //     const recentProductApproved = await this.prisma.product.findMany({
  //         where: { createdById: userId, status: 'APPROVED' },
  //         orderBy: { createdAt: 'desc' },
  //         take: 1,
  //     });

  //     const recentPromotionalAdRequest = await this.prisma.product.findMany({
  //         where: { createdById: userId, isPromoted: true },
  //         select: {
  //             id: true,
  //             partName: true,
  //             status: true,
  //             promoCost: true,
  //             createdAt: true,
  //         },
  //         orderBy: { createdAt: 'desc' },
  //         take: 1,
  //     });

  //     const recentPromotionalAdApproved = await this.prisma.product.findMany({
  //         where: { createdById: userId, isPromoted: true, status: 'APPROVED' },
  //         select: {
  //             id: true,
  //             partName: true,
  //             status: true,
  //             promoCost: true,
  //             createdAt: true,
  //         },
  //         orderBy: { createdAt: 'desc' },
  //         take: 1,
  //     });

  //     return {
  //         recentProductRequest,
  //         recentProductApproved,
  //         recentPromotionalAdRequest,
  //         recentPromotionalAdApproved
  //     };
  // }

  async getRecentActivity(userId: string) {
    const activities = await this.prisma.product.findMany({
      where: {
        createdById: userId,
        isPromoted: true,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: {
        id: true,
        partName: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    return activities;
  }

  // Recent listings
  async getRecentListings(userId: string) {
    const recentListings = await this.prisma.product.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        partName: true,
        photos: true,
        brand: true,
        category: true,
        price: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    return recentListings;
  }
}
