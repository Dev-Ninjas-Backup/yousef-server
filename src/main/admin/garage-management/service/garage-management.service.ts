import { Injectable, NotFoundException } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { successResponse } from 'src/common/utilsResponse/response.util';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import {
  UpdateGarageDto,
  UpdateGarageStatusDto,
} from '../dto/garage-management.dto';

@Injectable()
export class GarageManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------get all garage----------------
  @HandleError('Failed to get all garage', 'Garage')
  async getAllGarage() {
    const garage = await this.prisma.user.findMany({
      where: {
        role: 'GARAGE_OWNER',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        serviceCategories: true,
        isVerified: true,
        isTrialActive: true,
        trialStartDate: true,
        trialEndDate: true,
        freeProductsListing: true,
        garageLogo: true,
        tradeLicense: true,
      },
    });
    return successResponse(garage, 'Garage fetched successfully');
  }
  // ---------updater garage status---------------
  async update(id: string, dto: UpdateGarageDto) {
    const garage = await this.prisma.user.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException('Garage not found');

    // Merge fields; only provided fields are updated
    return this.prisma.user.update({
      where: { id },
      data: { ...dto },
    });
  }    

  // -------Only update garage updateStatus-------------

  @HandleError('Failed to update garage status', 'Garage')
  async updateStatus(id: string, dto: UpdateGarageStatusDto) {
    const garage = await this.prisma.user.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException('Garage not found');

    return this.prisma.user.update({
      where: { id },
      data: { ...dto },
    });
  }
  // ------------GET BY ID WISE GARAGE----
  @HandleError('Failed to get garage by id', 'Garage')
  async getGarageInfoById(id: string) {
    const garage = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        garageName: true,
        address: true,
        city: true,
        emirate: true,
        garageLogo: true,
        tradeLicense: true,
        garageStatus: true,
        isGarageVerified: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!garage) throw new NotFoundException('Garage not found');
    return garage;
  }

  // --------- delete garage----
  @HandleError('Failed to delete garage', 'Garage')
  async softDeleteGarage(id: string) {
    const garage = await this.prisma.user.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException('Garage not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        garageName: null,
        address: null,
        city: null,
        emirate: null,
        garageLogo: null,
        tradeLicense: null,
        garageStatus: 'PENDING',
        isGarageVerified: false,
      },
    });
  }

  findAll() {
    return `This action returns all garageManagement`;
  }

  findOne(id: number) {
    return `This action returns a #${id} garageManagement`;
  }
}
