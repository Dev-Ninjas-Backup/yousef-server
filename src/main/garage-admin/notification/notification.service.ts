import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async getAllApprovedProducts() {
    return await this.prisma.product.findMany({
      where: {
        status: 'APPROVED',
      },
    });
  }
}
