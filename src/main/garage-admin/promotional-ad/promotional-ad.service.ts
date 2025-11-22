import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

@Injectable()
export class PromotionalAdService {
  constructor(private prisma: PrismaService) {}

  async getPromotedProducts(userId: string) {
    return this.prisma.product.findMany({
      where: {
        sellerId: userId,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
