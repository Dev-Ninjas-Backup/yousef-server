import { Injectable, NotFoundException } from '@nestjs/common';
import { GarageStatus } from '@prisma/client';
import { GarageAcceptEmailTemplate } from 'src/common/email/garageaccept.template';
import { HandleError } from 'src/common/error/handle-error.decorator';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';
import { MailService } from 'src/lib/mail/mail.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { SearchGarageDto } from '../dto/filter.grage.dto';
import {
  UpdateGarageDto,
  UpdateGarageStatusDto,
} from '../dto/garage-management.dto';

@Injectable()
export class GarageManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // ---------get all garage----------------
  @HandleError('Failed to get all garage', 'Garage')
  async getAllGarage() {
    const users = await this.prisma.user.findMany({
      where: {
        isDeleted: false,
        role: 'GARAGE_OWNER',
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        serviceCategories: true,
        tradeLicense: true,
        garageLogo: true,
        garageName: true,
        createdAt: true,
        updatedAt: true,

        // ------------ Payments ------------
        Payment: {
          select: {
            amount: true,
          },
        },

        // ------------ All Garages ------------
        garages: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
      },
    });

    const result = users.map((u) => ({
      userId: u.id,
      ownerName: u.fullName,
      phone: u.phone,
      Garage_Name: u.garageName,
      serviceCategories: u.serviceCategories,
      Contract: u.phone,
      tradeLicense: u.tradeLicense,
      garageLogo: u.garageLogo,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      revenue: u.Payment.reduce((acc, p) => acc + (p.amount || 0), 0),

      garages: u.garages.map((g) => ({
        garageId: g.id,
        garageName: g.name,
        location: g.address,
        garageStatus: g.status,
      })),
    }));

    return successResponse(result, 'All garage fetched successfully');
  }

  // ----------search garage-------------

  @HandleError('Failed to search garage', 'Garage')
  async searchGarages(dto: SearchGarageDto) {
    const { page, limit, name, status } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (name) {
      where.garageName = { contains: name.trim(), mode: 'insensitive' };
    }

    if (status) {
      const s = status.trim().toUpperCase();
      if (Object.values(GarageStatus).includes(s as GarageStatus)) {
        where.garageStatus = s as GarageStatus;
      } else {
        throw new Error(
          `Invalid status filter. Expected one of: ${Object.values(
            GarageStatus,
          ).join(', ')}`,
        );
      }
    }

    // -------------Count total------------------
    const total = await this.prisma.user.count({ where });

    //----------------------  Fetch paginated -----------------------
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        phone: true,
        isDeleted: true,
        garageName: true,
        serviceCategories: true,
        tradeLicense: true,
        garageLogo: true,
        createdAt: true,
        updatedAt: true,
        garageStatus: true,
        garages: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        Payment: { select: { amount: true } },
      },
    });

    //------------------  Format result ---------------------
    const result = users.map((u) => ({
      userId: u.id,
      ownerName: u.fullName,
      phone: u.phone,
      Garage_Name: u.garageName,
      serviceCategories: u.serviceCategories,
      Contract: u.phone,
      isDeleted: u.isDeleted,
      tradeLicense: u.tradeLicense,
      garageLogo: u.garageLogo,
      garageStatus: u.garageStatus,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      revenue: u.Payment.reduce((acc, p) => acc + (p.amount || 0), 0),

      garages: u.garages.map((g) => ({
        garageId: g.id,
        garageName: g.name,
        location: g.address,
        garageStatus: u.garageStatus,
      })),
    }));

    return {
      success: true,
      message: 'Garage list fetched successfully',
      data: result,
      metadata: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
    };
  }

  // ---------updater garage sINFORMATION--------------
  @HandleError('Failed to update garage info', 'Garage')
  async updateGarageInfo(id: string, dto: UpdateGarageDto) {
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
  async updateStatus(
    id: string,
    dto: UpdateGarageStatusDto,
  ): Promise<TResponse<any>> {
    // ----------- Find the garage user-----------------
    const garage = await this.prisma.user.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException('Garage not found');

    //------------- If status is being updated to APPROVE and trial hasn't started yet----------------
    let trialData = {};
    if (dto.garageStatus === 'APPROVE' && !garage.isTrialActive) {
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setMonth(trialEnd.getMonth() + 3);

      trialData = {
        trialStartDate: trialStart,
        trialEndDate: trialEnd,
        isTrialActive: true,
        isSubscriptionTrialActive: true,
        subscriptionTrialStartDate: trialStart,
        subscriptionTrialEndDate: trialEnd,
      };
    }

    // ------------Update role to GARAGE_OWNER------------------
    await this.prisma.user.update({
      where: { id },
      data: { role: 'GARAGE_OWNER', isGarageVerified: true },
    });

    // ------------------Update status + trial info if needed-------------------
    const updatedGarage = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        ...trialData,
      },
    });

    // -------------------------------------
    // ------------------- Send email on approval -----------------------
    // -------------------------------------
    if (dto.garageStatus === 'APPROVE' && updatedGarage.email) {
      await this.mail.sendEmail(
        updatedGarage.email,
        'Your Garage Has Been Approved!',
        GarageAcceptEmailTemplate({
          name: updatedGarage.fullName ?? undefined,
          garageName: updatedGarage.garageName ?? undefined,
        }),
      );
    }
    return successResponse(updatedGarage, 'Garage status updated successfully');
  }

  // ------------GET BY ID WISE GARAGE----
  @HandleError('Failed to get garage by id', 'Garage')
  async getGarageInfoById(id: string) {
    const garage = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        garageName: true,

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

    const deletedGarage = await this.prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        garageName: undefined,

        city: undefined,
        emirate: undefined,
        garageLogo: undefined,
        tradeLicense: undefined,

        isGarageVerified: false,
      },
    });

    return successResponse(deletedGarage, 'Garage deleted successfully');
  }

  findAll() {
    return `This action returns all garageManagement`;
  }

  findOne(id: number) {
    return `This action returns a #${id} garageManagement`;
  }
}
