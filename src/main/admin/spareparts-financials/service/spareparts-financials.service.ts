import { Injectable } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { UpdateSparepartsDto } from '../dto/UpdateSpareparts.dto';

@Injectable()
export class SparepartsFinancialsService {
  // ------------------------- SparepartsFinancials ------------------------- //
  constructor(private readonly prisma: PrismaService) {}

  // Approve / Update spareparts status
  @HandleError('Failed to update spareparts')
  async updateSparepartsStatus(id: string, dto: UpdateSparepartsDto) {
    const spareparts = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!spareparts) {
      throw new Error('Spareparts not found');
    }

    // Update status dynamically based on DTO
    const updatedSpareparts = await this.prisma.product.update({
      where: { id },
      data: {
        status: dto.status, // now accepts any valid ProductStatus
      },
    });

    return updatedSpareparts;
  }

  // -------------Delete spareparts
  @HandleError('Failed to delete spareparts')
  async removeParts(id: string) {
    const spareparts = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!spareparts) {
      throw new Error('Spareparts not found');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Spareparts deleted successfully' };
  }

  // ---------------------- rack revenue, payments, and transactions-----------
  @HandleError('Failed to get financial overview')
  async FinancialOverview() {
    return this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
      },
      //  --------this month revenue-----------
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // ---------- revinue transactions charts----

  @HandleError('Failed to get revenue transactions')
  async RevenueTransactions() {
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

  // --------------- RECENT TRANSACTIONS ---------------
  @HandleError('Failed to get recent transactions')
  async RecentTransactions() {
    return this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
      },
      include: {
        user: true,
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
  }
}
