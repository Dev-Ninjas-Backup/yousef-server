import { Injectable } from '@nestjs/common';
import { GarageStatus, UserRole } from '@prisma/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { HandleError } from 'src/common/error/handle-error.decorator';
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
  productStats: {
    total: number;
    newLast30Days: number;
    percentageChange: number;
  };
  pendingProductStats: {
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
    if (prior > 0) {
      return parseFloat((((current - prior) / prior) * 100).toFixed(2));
    }
    return current > 0 ? 100 : 0;
  }

  // ------------------ Recent Activity Method ------------------

  @HandleError('Failed to fetch recent activity')
  async getRecentActivity(): Promise<RecentActivityItem[]> {
    const limit = 10;

    // Execute all queries in parallel for better performance
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
          status: 'Pending Approval',
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
      this.prisma.user.findMany({
        select: {
          id: true,
          garageName: true,
          createdAt: true,
        },
        where: {
          role: UserRole.GARAGE_OWNER,
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
        message: `New garage registration: ${g.garageName || 'Unnamed Garage'}`,
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
    // --- Date Helper Calculations ---
    const today = new Date();

    // Last 30 days (Current Period: CP) start date
    const last30DaysStart = new Date(today);
    last30DaysStart.setDate(today.getDate() - 30);

    // Previous 30 days (Prior Period: PP) start date
    const prior30DaysStart = new Date(today);
    prior30DaysStart.setDate(today.getDate() - 60);

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
      // Revenue - Current Period
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: last30DaysStart } },
      }),
      // Revenue - Prior Period
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: prior30DaysStart, lt: last30DaysStart } },
      }),
      // Products - Total
      this.prisma.product.count(),
      // Products - Current Period
      this.prisma.product.count({
        where: { createdAt: { gte: last30DaysStart } },
      }),
      // Products - Prior Period
      this.prisma.product.count({
        where: { createdAt: { gte: prior30DaysStart, lt: last30DaysStart } },
      }),
      // Products - Pending (Using the string from the schema)
      this.prisma.product.count({
        where: { status: 'Pending Approval' },
      }),
      // Users - Total
      this.prisma.user.count(),
      // Users - Current Period
      this.prisma.user.count({
        where: { createdAt: { gte: last30DaysStart } },
      }),
      // Garages - Total
      this.prisma.user.count({
        where: { role: UserRole.GARAGE_OWNER },
      }),
      // Garages - Current Period
      this.prisma.user.count({
        where: {
          role: UserRole.GARAGE_OWNER,
          createdAt: { gte: last30DaysStart },
        },
      }),
      // Garages - Pending
      this.prisma.user.count({
        where: {
          role: UserRole.GARAGE_OWNER,
          garageStatus: GarageStatus.PENDING,
        },
      }),
      // Messages - Unread
      this.prisma.privateMessage.count({
        where: { isRead: false },
      }),
      // Recent Activity - CALLS THE METHOD ABOVE
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
      productStats: {
        total: totalProducts,
        newLast30Days: currentMonthProductsCount,
        percentageChange: productPercentageChange,
      },
      pendingProductStats: {
        pendingApprovalCount: productPending,
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
}
