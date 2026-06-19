import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppError } from 'src/common/error/handle-error.app';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class OverviewService {
  constructor(private prisma: PrismaService) {}

  async getUserOverview(userId: string, garageId?: string) {
    const productWhere: any = { createdById: userId };
    if (garageId) {
      productWhere.garageId = garageId;
    }

    const [
      totalListings,
      totalActiveListings,
      totalPendingListings,
      totalInquiries,
      totalDrafts,
    ] = await Promise.all([
      // Total listing
      this.prisma.product.count({
        where: productWhere,
      }),

      // Active Listing
      this.prisma.product.count({
        where: { ...productWhere, status: 'APPROVED' },
      }),

      // Pending Listing
      this.prisma.product.count({
        where: { ...productWhere, status: 'PENDING' },
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

      // Drafts
      this.prisma.product.count({
        where: { ...productWhere, status: 'DRAFT' },
      }),
    ]);

    return {
      totalProducts: totalListings,
      activeListings: totalActiveListings,
      pendingApproval: totalPendingListings,
      totalInquiries,
      totalDrafts,
    };
  }

  // Performance summary
  async getPerformanceSummary(userId: string, garageId?: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const productWhere: any = { createdById: userId };
    if (garageId) {
      productWhere.garageId = garageId;
    }

    const [totalViewsResult, totalReceived, totalRead] = await Promise.all([
      this.prisma.product.aggregate({
        where: productWhere,
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

  async getRecentActivity(userId: string, garageId?: string) {
    const where: any = {
      createdById: userId,
      isPromoted: true,
      status: { in: ['PENDING', 'APPROVED'] },
    };
    if (garageId) {
      where.garageId = garageId;
    }

    const activities = await this.prisma.product.findMany({
      where,
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
  async getRecentListings(userId: string, garageId?: string) {
    const where: any = { createdById: userId };
    if (garageId) {
      where.garageId = garageId;
    }

    const recentListings = await this.prisma.product.findMany({
      where,
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
