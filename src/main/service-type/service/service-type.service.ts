import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class ServiceTypeService {
  constructor(private prisma: PrismaService) {}

  async addServiceCategory(serviceCategory: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { serviceCategories: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.serviceCategories.includes(serviceCategory)) {
      throw new BadRequestException('Service category already exists');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        serviceCategories: {
          push: serviceCategory,
        },
      },
      select: {
        id: true,
        serviceCategories: true,
      },
    });
  }

  async getUserServiceCategories(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        serviceCategories: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getCombinedUniqueServiceCategories(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        serviceCategories: true,
        garages: {
          select: {
            services: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userCategories = user.serviceCategories || [];

    const garageServices = user.garages
      .flatMap((garage) => garage.services || [])
      .filter(Boolean);

    const allCategories = [...userCategories, ...garageServices];

    // unique + sort (optional sort)
    const uniqueCategories = [...new Set(allCategories)].sort((a, b) =>
      a.localeCompare(b),
    );

    return {
      serviceCategories: uniqueCategories,
      total: uniqueCategories.length,
    };
  }
}
