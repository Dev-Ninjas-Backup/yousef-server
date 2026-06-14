import { Injectable } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { successResponse } from 'src/common/utilsResponse/response.util';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class UserManagementService {
  constructor(private readonly prisma: PrismaService) {}

  @HandleError('Failed to get all users', 'User')
  async getAllUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause: any = {
      isDeleted: false,
    };

    // Add role filter if provided
    if (query.role) {
      whereClause.role = query.role;
    }

    if (query.search) {
      whereClause.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [
      total,
      totalUsers,
      carOwners,
      garageOwners,
      activePaid,
      activeTrial,
      subscribedUsers,
    ] = await Promise.all([
      this.prisma.user.count({
        where: whereClause,
      }),
      this.prisma.user.count({ where: { isDeleted: false } }),
      this.prisma.user.count({
        where: { isDeleted: false, role: 'CAR_OWNER' },
      }),
      this.prisma.user.count({
        where: { isDeleted: false, role: 'GARAGE_OWNER' },
      }),
      this.prisma.user.count({
        where: {
          isDeleted: false,
          role: { in: ['GARAGE_OWNER', 'CAR_OWNER'] },
          OR: [{ isSubscribed: true }, { productMonthlyActive: true }],
        },
      }),
      this.prisma.user.count({
        where: {
          isDeleted: false,
          role: { in: ['GARAGE_OWNER', 'CAR_OWNER'] },
          OR: [{ isTrialActive: true }, { isSubscriptionTrialActive: true }],
        },
      }),
      this.prisma.user.count({
        where: {
          isDeleted: false,
          role: { in: ['GARAGE_OWNER', 'CAR_OWNER'] },
          OR: [
            { isSubscribed: true },
            { productMonthlyActive: true },
            { isTrialActive: true },
            { isSubscriptionTrialActive: true },
          ],
        },
      }),
    ]);

    const users = await this.prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        role: true,
        fullName: true,
        phone: true,
        profilePhoto: true,
        bio: true,
        email: true,
        isActive: true,
        garageStatus: true,
        isGarageVerified: true,
        createdAt: true,
        updatedAt: true,
        isVerified: true,
        isDeleted: true,
        promotionCredits: true,
        isTrialActive: true,
        isSubscriptionTrialActive: true,
        isSubscribed: true,
        productMonthlyActive: true,
        productMonthlyPlanType: true,
        _count: {
          select: {
            garages: true,
          },
        },
      },
    });

    const noSubscription =
      garageOwners + carOwners - (activePaid + activeTrial);

    // Optional: rename _count.garages to garageCount
    const formattedUsers = users.map((user) => {
      let subscriptionType = 'None';
      if (user.role === 'GARAGE_OWNER' || user.role === 'CAR_OWNER') {
        if (user.isSubscribed) {
          subscriptionType = 'Paid Monthly';
        } else if (user.productMonthlyActive) {
          const planName = user.productMonthlyPlanType
            ? user.productMonthlyPlanType.charAt(0).toUpperCase() +
              user.productMonthlyPlanType.slice(1).toLowerCase()
            : 'Pro';
          subscriptionType = `Monthly ${planName}`;
        } else if (user.isTrialActive || user.isSubscriptionTrialActive) {
          subscriptionType = 'Free Trial';
        } else {
          subscriptionType = 'No Subscription';
        }
      }

      return {
        ...user,
        vehicles: user._count.garages,
        subscriptionType,
      };
    });

    return successResponse(
      {
        data: formattedUsers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          totalUsers,
          carOwners,
          garageOwners,
          activePaid,
          activeTrial,
          subscribedUsers,
          noSubscription: noSubscription > 0 ? noSubscription : 0,
        },
      },
      'All users retrieved successfully',
    );
  }
  // -------------get specific user access admin only--------
  @HandleError('Failed to get user', 'User')
  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        role: true,
        fullName: true,
        phone: true,
        profilePhoto: true,
        bio: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        deletedAt: true,
        garageStatus: true,
        isGarageVerified: true,
        isVerified: true,
        isDeleted: true,
        promotionCredits: true,
      },
    });
    return successResponse(user, 'User retrieved successfully');
  }

  // -----------soft delete user access admin only
  @HandleError('Failed to delete user', 'User')
  async deleteUser(id: string) {
    const user = await this.prisma.user.update({
      where: {
        id,
        isDeleted: false,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return successResponse(user, 'User deleted successfully');
  }

  // soft delete user access admin only
  @HandleError('Failed to delete user', 'User')
  async remove(id: string) {
    const user = await this.prisma.user.update({
      where: {
        id,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    return successResponse(user, 'User deleted successfully');
  }

  // ------------UserRoleChange--------------
  async UserRoleChange(id: string) {
    // ------------Update role to ADMIN------------------
    await this.prisma.user.update({
      where: { id },
      data: { role: 'SUPER_ADMIN' },
    });

    return successResponse(null, 'User role changed to ADMIN successfully');
  }

  // ------------Update promotion credits--------------
  async updatePromotionCredits(id: string, credits: number) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { promotionCredits: Number(credits) },
    });

    return successResponse(user, 'User promotion credits updated successfully');
  }
}
