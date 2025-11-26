import { Injectable } from '@nestjs/common';
import { AppError } from 'src/common/error/handle-error.app';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class OverviewService {
  constructor(private prisma: PrismaService) { }

  async getUserOverview(userId: string) {
    const [
      totalListings,
      totalActiveListings,
      totalPendingListings,
      totalInquiries,
    ] = await Promise.all([
      // Total listing
      this.prisma.product.count({
        where: { createdById: userId },
      }),

      // Active Listing
      this.prisma.product.count({
        where: { createdById: userId, status: 'APPROVED' },
      }),

      // Pending Listing
      this.prisma.product.count({
        where: { createdById: userId, status: 'PENDING' },
      }),

      // Inquiries
      this.prisma.privateMessage.count({
        where: {
          isRead: false,
          senderId: { not: userId },
          conversation: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
          },
        },
      }),
    ]);

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

  // Get available listing
  async getAvailableListing(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const totalFreeProducts = 3;
    const freeProductsUsed = user.freeProductsUsed || 0;
    const freeProductsRemaining = Math.max(
      0,
      totalFreeProducts - freeProductsUsed,
    );
    const hasFreeProductsLeft = freeProductsRemaining > 0;
    const usagePercentage = Math.round(
      (freeProductsUsed / totalFreeProducts) * 100,
    );
    const remainingPercentage = 100 - usagePercentage;

    return {
      totalFreeProducts,
      freeProductsUsed,
      freeProductsRemaining,
      remainingPercentage,
      hasFreeProductsLeft,
    };
  }
}