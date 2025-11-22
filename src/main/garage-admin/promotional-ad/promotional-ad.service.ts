import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

@Injectable()
export class PromotionalAdService {
  constructor(private prisma: PrismaService) { }

  async getPromotedProducts(userId: string) {
    return this.prisma.product.findMany({
      where: {
        createdById: userId,
        isPromoted: true,
        status: 'APPROVED',
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            sellerType: true,
            isVerified: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserStats(userId: string) {
    // Get user's free listing usage
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        freeProductsUsed: true,
      },
    });

    // Count active ads (approved and promoted products)
    const activeAds = await this.prisma.product.count({
      where: {
        createdById: userId,
        status: 'APPROVED',
        isPromoted: true,
      },
    });

    // Count pending approval products
    const pendingApproval = await this.prisma.product.count({
      where: {
        createdById: userId,
        status: 'PENDING',
      },
    });

    return {
      freeListingUsed: user?.freeProductsUsed || 0,
      activeAds,
      pendingApproval,
    };
  }
}
