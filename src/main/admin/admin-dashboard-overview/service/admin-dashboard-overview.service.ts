import { Injectable } from '@nestjs/common';
import { GarageStatus, UserRole } from '@prisma/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { HandleError } from 'src/common/error/handle-error.decorator';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';
import { PrismaService } from 'src/lib/prisma/prisma.service';

dayjs.extend(relativeTime);

// Define a common structure for recent activity items
export interface RecentActivityItem {
  id: string;
  type: 'PRODUCT_SUBMISSION' | 'NEW_GARAGE' | 'NEW_USER';
  message: string;
  timestamp: Date;
  timeAgo: string;
}

// Define dashboard overview return type
export interface DashboardOverview {
  userStats: {
    total: number;
    newLast30Days: number;
    percentageChange: number;
  };
  garageStats: {
    totalOwners: number;
    newLast30Days: number;
    pendingApproval: number;
    percentageChange: number;
  };
  PartsListing: {
    total: number;
    newLast30Days: number;
    percentageChange: number;
  };
  pendingAllTotal: {
    pendingApprovalCount: number;
  };
  messageStats: {
    unreadCount: number;
  };
  revenueStats: {
    totalRevenueLast30Days: number;
    prior30DaysRevenue: number;
    percentageGrowth: number;
  };
}

@Injectable()
export class AdminDashboardOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------ Helper Methods ------------------

  /**
   * Calculates percentage change between current and prior periods
   */
  private calculatePercentageChange(current: number, prior: number): number {
    // No change: return 0
    if (current === prior) return 0;

    // Normal calculation when prior > 0
    if (prior > 0) {
      const result = ((current - prior) / prior) * 100;
      return parseFloat(result.toFixed(2));
    }

    // When prior == 0:
    // If current > 0 ---> 100% growth
    if (prior === 0 && current > 0) {
      return 100;
    }

    return 0;
  }

  // ------------------ Recent Activity Method ------------------

  @HandleError('Failed to fetch recent activity')
  async getRecentActivity(): Promise<RecentActivityItem[]> {
    const limit = 10;
    const [recentProducts, recentUsers, recentGarages] = await Promise.all([
      // ----------- Fetch recent product submissions (those currently pending approval)------------------
      this.prisma.product.findMany({
        select: {
          id: true,
          partName: true,
          createdAt: true,
          status: true,
          seller: {
            select: {
              name: true,
            },
          },
        },
        where: {
          status: 'PENDING',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      }),
      // ---------- Fetch recent new user registrations (Car Owners)------------
      this.prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          createdAt: true,
        },
        where: {
          role: UserRole.CAR_OWNER,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      }),
      // ------------ Fetch recent new garage registrations (Garage Owners)------------------
      this.prisma.garage.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      }),
    ]);

    //---------------- Combine and standardize the activities------------------
    const combinedActivity: RecentActivityItem[] = [
      ...recentProducts.map((p) => ({
        id: p.id,
        type: 'PRODUCT_SUBMISSION' as const,
        message: `New part submitted for approval by ${p.seller.name || 'Unknown Seller'}: ${p.partName || 'Unnamed Product'}`, // Enhanced message
        timestamp: p.createdAt,
        timeAgo: dayjs(p.createdAt).fromNow(),
      })),
      ...recentGarages.map((g) => ({
        id: g.id,
        type: 'NEW_GARAGE' as const,
        message: `New garage registration: ${g.name || 'Unnamed Garage'}`,
        timestamp: g.createdAt,
        timeAgo: dayjs(g.createdAt).fromNow(),
      })),
      ...recentUsers.map((u) => ({
        id: u.id,
        type: 'NEW_USER' as const,
        message: `New user registration: ${u.fullName || 'Unnamed User'}`,
        timestamp: u.createdAt,
        timeAgo: dayjs(u.createdAt).fromNow(),
      })),
    ];

    // Sort all activities by timestamp (most recent first) and return top 'limit'
    return combinedActivity
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // ------------------ Dashboard Overview Method ------------------

  @HandleError('Failed to retrieve dashboard overview data')
  async getDashboardOverview(): Promise<DashboardOverview> {
    const today = new Date();

    const last30DaysStart = new Date(today);
    last30DaysStart.setDate(today.getDate() - 30);

    // Previous 30 days (Prior Period: PP) start date
    const LastMonth = new Date(today);
    LastMonth.setDate(today.getDate() - 60);

    // Execute all database queries in parallel for optimal performance
    const [
      currentRevenueAggregate,
      priorRevenueAggregate,
      totalProducts,
      currentMonthProductsCount,
      priorMonthProductsCount,
      productPending,
      totalUsers,
      lastMonthUsersCount,
      totalGaragesOwners,
      lastMonthGaragesOwnersCount,
      pendingGaragesOwners,
      unreadMessages,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: last30DaysStart } },
      }),

      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: LastMonth, lt: last30DaysStart } },
      }),
      // Products - Total
      this.prisma.product.count(),
      // Products - Current Period
      this.prisma.product.count({
        where: { createdAt: { gte: last30DaysStart } },
      }),

      this.prisma.product.count({
        where: { createdAt: { gte: LastMonth, lt: last30DaysStart } },
      }),

      this.prisma.product.count({
        where: { status: 'APPROVED' },
      }),

      this.prisma.user.count(),

      this.prisma.user.count({
        where: { createdAt: { gte: last30DaysStart } },
      }),
      // Garages - Total
      this.prisma.user.count({
        where: { role: UserRole.GARAGE_OWNER },
      }),

      this.prisma.user.count({
        where: {
          role: UserRole.GARAGE_OWNER,
          createdAt: { gte: last30DaysStart },
        },
      }),

      this.prisma.user.count({
        where: {
          role: UserRole.GARAGE_OWNER,
          garageStatus: GarageStatus.PENDING,
        },
      }),

      this.prisma.privateMessage.count({
        where: { isRead: false },
      }),

      this.getRecentActivity(),
    ]);

    // --- Calculate Revenue Stats ---
    const currentRevenue = currentRevenueAggregate._sum.amount || 0;
    const priorRevenue = priorRevenueAggregate._sum.amount || 0;
    const revenuePercentageGrowth = this.calculatePercentageChange(
      Number(currentRevenue),
      Number(priorRevenue),
    );

    // --- Calculate Product Stats ---
    const productPercentageChange = this.calculatePercentageChange(
      currentMonthProductsCount,
      priorMonthProductsCount,
    );

    // --- Calculate User Stats ---
    const lastMonthUsersPercentage = this.calculatePercentageChange(
      lastMonthUsersCount,
      totalUsers - lastMonthUsersCount,
    );
    // Note: The denominator here should ideally be the total users *before* the last 30 days,
    // but using total users is a common dashboard simplification.
    // Using (totalUsers - lastMonthUsersCount) is a rough approximation of the prior period base.

    // --- Calculate Garage Stats ---
    const lastMonthGaragesPercentage = this.calculatePercentageChange(
      lastMonthGaragesOwnersCount,
      totalGaragesOwners - lastMonthGaragesOwnersCount,
    );

    //-----------product pending status count--------------
    await this.prisma.product.count({
      where: { status: 'PENDING' },
    });
    // -------------grage pending status count-------------
    await this.prisma.user.count({
      where: { garageStatus: 'PENDING' },
    });
    // --- Final Simplified Return for Frontend Cards ---
    return {
      userStats: {
        total: totalUsers,
        newLast30Days: lastMonthUsersCount,
        percentageChange: lastMonthUsersPercentage,
      },
      garageStats: {
        totalOwners: totalGaragesOwners,
        newLast30Days: lastMonthGaragesOwnersCount,
        pendingApproval: pendingGaragesOwners,
        percentageChange: lastMonthGaragesPercentage,
      },
      PartsListing: {
        total: totalProducts,
        newLast30Days: currentMonthProductsCount,
        percentageChange: productPercentageChange,
      },
      pendingAllTotal: {
        pendingApprovalCount: productPending + pendingGaragesOwners,
      },
      messageStats: {
        unreadCount: unreadMessages,
      },
      revenueStats: {
        totalRevenueLast30Days: parseFloat(Number(currentRevenue).toFixed(2)),
        prior30DaysRevenue: parseFloat(Number(priorRevenue).toFixed(2)),
        percentageGrowth: revenuePercentageGrowth,
      },
    };
  }

  // ------------------------ Parts Category Statistics ------------------------
  // ------------------------ Parts Category Statistics ------------------------
  @HandleError('Failed to fetch parts category statistics', 'Parts Category')
  async getStatistics(): Promise<TResponse<any>> {
    // Get total product count
    const totalProducts = await this.prisma.product.count();

    // Get product count by category
    const categoryStats = await this.prisma.product.groupBy({
      by: ['categoryId'],
      _count: {
        categoryId: true,
      },
      orderBy: {
        _count: {
          categoryId: 'asc',
        },
      },
    });

    // Fetch category names
    const categoryIds = categoryStats.map((stat) => stat.categoryId);
    const categories = await this.prisma.partsCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Calculate percentages and format data
    const statistics = categoryStats.map((stat) => ({
      categoryId: stat.categoryId,
      categoryName: categoryMap.get(stat.categoryId) || 'Unknown',
      productCount: stat._count.categoryId || 0,
      percentage:
        totalProducts > 0
          ? parseFloat(
              (((stat._count.categoryId || 0) / totalProducts) * 100).toFixed(
                2,
              ),
            )
          : 0,
    }));

    const result = {
      totalProducts,
      categoryStatistics: statistics,
    };

    return successResponse(
      result,
      'Parts category statistics retrieved successfully',
    );
  }

  // ------------getRevenueTrends for monthly revenue trend---------
  @HandleError('Failed to fetch revenue trends', 'Revenue Trends')
  async getRevenueTrends() {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Month names array
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const monthlyRevenue: Record<string, number> = {};

    for (const payment of payments) {
      if (!payment.amount) continue;

      const monthIndex = payment.createdAt.getMonth();
      const year = payment.createdAt.getFullYear();

      const key = `${year}-${monthIndex}`;

      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + payment.amount;
    }

    // Convert to array with month names
    return Object.entries(monthlyRevenue).map(([key, revenue]) => {
      const [year, monthIndex] = key.split('-');
      return {
        month: `${monthNames[parseInt(monthIndex)]} ${year}`,
        revenue,
      };
    });
  }
}
