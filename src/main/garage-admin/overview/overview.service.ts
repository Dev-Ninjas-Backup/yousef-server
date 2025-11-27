import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppError } from 'src/common/error/handle-error.app';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class OverviewService {
  constructor(private prisma: PrismaService) {}

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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalViewsResult, totalReceived, totalRead] = await Promise.all([
      this.prisma.product.aggregate({
        where: { createdById: userId },
        _sum: { views: true },
      }),

      this.prisma.privateMessage.count({
        where: {
          conversation: { OR: [{ user1Id: userId }, { user2Id: userId }] },
          senderId: { not: userId },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      this.prisma.privateMessage.count({
        where: {
          conversation: { OR: [{ user1Id: userId }, { user2Id: userId }] },
          senderId: { not: userId },
          isRead: true,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    const conversationRate =
      totalReceived > 0 ? Math.round((totalRead / totalReceived) * 100) : 0;

    return {
      totalViews: totalViewsResult._sum.views || 0,
      monthlyInquiries: totalReceived,
      conversationRate: `${conversationRate}%`,
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

    const paymentConfig = await this.prisma.paymentConfigure.findFirst();

    if (!paymentConfig) {
      throw new InternalServerErrorException(
        'Platform payment configuration missing!',
      );
    }

    const totalFreeProducts = Number(
      paymentConfig?.freePromotionalListings || 0,
    );
    const freeProductsUsed = user.freeProductsUsed || 0;
    const freeProductsRemaining = Math.max(
      0,
      (totalFreeProducts as number) - freeProductsUsed,
    );
    const hasFreeProductsLeft = freeProductsRemaining > 0;
    const usagePercentage = Math.round(
      (freeProductsUsed / (totalFreeProducts as number)) * 100,
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
