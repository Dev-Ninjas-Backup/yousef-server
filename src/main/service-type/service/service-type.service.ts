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

  async updateServiceCategory(
    oldName: string,
    newName: string,
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { serviceCategories: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!user.serviceCategories.includes(oldName)) {
      throw new BadRequestException(`Service "${oldName}" not found`);
    }

    if (user.serviceCategories.includes(newName)) {
      throw new BadRequestException(`Service "${newName}" already exists`);
    }

    const updated = user.serviceCategories.map((s) =>
      s === oldName ? newName : s,
    );

    return this.prisma.user.update({
      where: { id: userId },
      data: { serviceCategories: updated },
      select: { id: true, serviceCategories: true },
    });
  }

  async removeServiceCategory(serviceName: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { serviceCategories: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!user.serviceCategories.includes(serviceName)) {
      throw new BadRequestException(`Service "${serviceName}" not found`);
    }

    const updated = user.serviceCategories.filter((s) => s !== serviceName);

    return this.prisma.user.update({
      where: { id: userId },
      data: { serviceCategories: updated },
      select: { id: true, serviceCategories: true },
    });
  }

  async getAllCombinedUniqueServiceCategories() {
    // Canonical service list — single source of truth
    const CANONICAL_SERVICES = [
      'Oil Change',
      'Brake Repair',
      'AC Service',
      'Electrical Repair',
      'Engine Repair',
      'Tire Service',
      'Body Work',
      'Diagnostics',
      'Towing',
      'Emergency Towing',
      'Van Doorstep Repair',
      'Battery Replacement',
      'Transmission Service',
      'Suspension Repair',
    ];

    // Normalize map — old names → canonical names
    const NORMALIZE_MAP: Record<string, string> = {
      Electrical: 'Electrical Repair',
      'Tire Rotation': 'Tire Service',
      'Tyre Service': 'Tire Service',
    };

    const users = await this.prisma.user.findMany({
      select: {
        serviceCategories: true,
        garages: {
          select: {
            services: true,
          },
        },
      },
    });

    const allCategories = users.flatMap((user) => [
      ...(user.serviceCategories || []),
      ...(user.garages?.flatMap((garage) => garage.services || []) || []),
    ]);

    // Normalize + unique + only canonical
    const normalized = allCategories.map((s) => NORMALIZE_MAP[s] || s);

    const uniqueCategories = [
      ...new Set([...CANONICAL_SERVICES, ...normalized]),
    ]
      .filter((s) => CANONICAL_SERVICES.includes(s))
      .sort((a, b) => a.localeCompare(b));

    return {
      serviceCategories: uniqueCategories,
      total: uniqueCategories.length,
    };
  }
}
