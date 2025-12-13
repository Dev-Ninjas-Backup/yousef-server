import { Injectable } from '@nestjs/common';
import { AppError } from 'src/common/error/handle-error.app';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { MailService } from 'src/lib/mail/mail.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { UpdateSparepartsDto } from '../dto/UpdateSpareparts.dto';

@Injectable()
export class SparepartsFinancialsService {
  // ------------------------- SparepartsFinancials ------------------------- //
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // Approve / Update spareparts status
  @HandleError('Failed to update spareparts')
  async updateSparepartsStatus(id: string, dto: UpdateSparepartsDto) {
    const spareparts = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!spareparts) {
      throw new AppError(404, 'Spare parts not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: spareparts.createdById },
    });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const productNotification =
      await this.prisma.garageAdminNotification.findUnique({
        where: {
          userId: spareparts.createdById,
        },
        select: { productApprovalNotification: true },
      });

    if (productNotification?.productApprovalNotification) {
      console.log('Product Notification');
      await this.mailService.sendProductUpdateEmail(user.email as string, {
        userName: user?.fullName as string,
        productName: spareparts?.partName as string,
        status: dto.status as 'PENDING' | 'APPROVED' | 'REJECTED',
      });
    }

    // Update status dynamically based on DTO
    const updatedSpareparts = await this.prisma.product.update({
      where: { id },
      data: {
        status: dto.status,
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

  // ---------------------- Track revenue, payments, and transactions-----------
  @HandleError('Failed to get financial overview')
  async FinancialOverview() {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    const [thisMonthRevenue, revenueByType] = await Promise.all([
      // This month's total revenue
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
      }),

      // Revenue by payment type
      this.prisma.payment.groupBy({
        by: ['paymentType'],
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
    ]);

    return {
      thisMonthRevenue: thisMonthRevenue._sum.amount || 0,
      revenueByType: revenueByType.map((item) => ({
        type: item.paymentType,
        amount: item._sum.amount || 0,
      })),
    };
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
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            partName: true,
            photos: true,
            price: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return payments.map((payment) => ({
      id: payment.id,
      Type: payment.paymentType,
      amount: payment.amount,
      status: payment.status,
      source: payment.garageSubscriptionId,
      date: payment.createdAt.toISOString().split('T')[0],

      paymentMethod: payment.paymentMethod,
      customerName: payment.user?.fullName || 'N/A',
      customerEmail: payment.user?.email || 'N/A',
      customerPhoto: payment.user?.profilePhoto || null,

      productPrice: payment.product?.price,
      productID: payment.product?.id || 'N/A',

      productPhoto: payment.product?.photos?.[0] || null,
      productDescription: payment.product?.description || 'N/A',
      userInformation: payment.user?.id || 'N/A',

      updatedAt: payment.updatedAt.toISOString().split('T')[0],
    }));
  }

  // ----------------Last30AllDataExport-----------------

  // ----------------Last30AllDataExport-----------------
  @HandleError('Failed to export last 30 days data')
  async Last30AllDataExport() {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: last30Days },
      },
      select: {
        id: true,
        amount: true,
        paymentType: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format for easy frontend table/CSV export
    return payments.map((payment) => ({
      id: payment.id,
      date: payment.createdAt.toISOString().split('T')[0],
      customerName: payment.user?.fullName || 'N/A',
      customerEmail: payment.user?.email || 'N/A',
      amount: payment.amount,
      type: payment.paymentType,
      method: payment.paymentMethod,
      status: payment.status,
    }));
  }
}
