import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import chalk from 'chalk';
import { ENVEnum } from 'src/common/enum/env.enum';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { UtilsService } from 'src/lib/utils/utils.service';

const DEFAULT_SERVICE_CATEGORIES = [
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

@Injectable()
export class SuperAdminService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): Promise<void> {
    return this.seedSuperAdminUser();
  }

  async seedSuperAdminUser(): Promise<void> {
    const superAdminEmail = this.configService.getOrThrow<string>(
      ENVEnum.SUPER_ADMIN_EMAIL,
    );
    const superAdminPass = this.configService.getOrThrow<string>(
      ENVEnum.SUPER_ADMIN_PASS,
    );

    const superAdminExists = await this.prisma.user.findFirst({
      where: {
        email: superAdminEmail,
      },
    });

    // * create super admin
    if (!superAdminExists) {
      await this.prisma.user.create({
        data: {
          email: superAdminEmail,
          password: await this.utils.hash(superAdminPass),
          fullName: 'Super Admin',
          role: 'SUPER_ADMIN',
          isVerified: true,
          isActive: true,
          serviceCategories: DEFAULT_SERVICE_CATEGORIES,
        },
      });
      console.info(
        chalk.bgGreen.white.bold(
          `🚀 Super Admin user created with email: ${superAdminEmail}`,
        ),
      );
      return;
    }

    // * Log & update if super admin already exists
    await this.prisma.user.update({
      where: {
        email: superAdminEmail,
      },
      data: {
        isActive: true,
        isVerified: true,
        role: 'SUPER_ADMIN',
        serviceCategories: DEFAULT_SERVICE_CATEGORIES,
      },
    });
    console.info(
      chalk.bgGreen.white.bold(
        `🚀 Super Admin user exists with email: ${superAdminEmail}`,
      ),
    );
  }
}
