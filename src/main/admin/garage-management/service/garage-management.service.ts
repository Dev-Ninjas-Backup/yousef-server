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
  ) { }

  // ---------get all garage----------------
  @HandleError('Failed to get all garage', 'Garage')
  async getAllGarage() {
    const users = await this.prisma.user.findMany({
      where: {
        isDeleted: false,
        role: 'GARAGE_OWNER'

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
            coverPhoto: true,
            profileImage: true,
            garagePhone: true,
            email: true,
            street: true,
            city: true,
            emirate: true,
            address: true,
            formattedAddress: true,
            placeId: true,
            garageLat: true,
            garageLng: true,
            description: true,
            certifications: true,
            weekdaysHours: true,
            weekendsHours: true,
            brandExpertise: true,
            status: true,
            services: true,
            createdAt: true,
            updatedAt: true,
          }
        }
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
        coverPhoto: g.coverPhoto,
        profileImage: g.profileImage,
        garagePhone: g.garagePhone,
        email: g.email,
        street: g.street,
        city: g.city,
        emirate: g.emirate,
        location: g.address,
        formattedAddress: g.formattedAddress,
        placeId: g.placeId,
        garageLat: g.garageLat,
        garageLng: g.garageLng,
        description: g.description,
        certifications: g.certifications,
        weekdaysHours: g.weekdaysHours,
        weekendsHours: g.weekendsHours,
        brandExpertise: g.brandExpertise,
        garageStatus: g.status,
        services: g.services,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
    }));

    return successResponse(result, 'All garage fetched successfully');
  }
  // ---------- search garage -------------

  @HandleError('Failed to search garage', 'Garage')
  async searchGarages(dto: SearchGarageDto) {

    const { page, limit, name, status } = dto;
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
      role: 'GARAGE_OWNER',
    };

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
        garageStatus: true,
        serviceCategories: true,
        tradeLicense: true,
        garageLogo: true,
        createdAt: true,
        updatedAt: true,
        garages: {
          select: {
            id: true,
            name: true,
            coverPhoto: true,
            profileImage: true,
            garagePhone: true,
            email: true,
            street: true,
            city: true,
            emirate: true,
            address: true,
            formattedAddress: true,
            placeId: true,
            garageLat: true,
            garageLng: true,
            description: true,
            certifications: true,
            weekdaysHours: true,
            weekendsHours: true,
            brandExpertise: true,
            status: true,
            services: true,
            createdAt: true,
            updatedAt: true,
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
        coverPhoto: g.coverPhoto,
        profileImage: g.profileImage,
        garagePhone: g.garagePhone,
        email: g.email,
        street: g.street,
        city: g.city,
        emirate: g.emirate,
        location: g.address,
        formattedAddress: g.formattedAddress,
        placeId: g.placeId,
        garageLat: g.garageLat,
        garageLng: g.garageLng,
        description: g.description,
        certifications: g.certifications,
        weekdaysHours: g.weekdaysHours,
        weekendsHours: g.weekendsHours,
        brandExpertise: g.brandExpertise,
        garageStatus: g.status,
        services: g.services,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
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

  // -------Update garage status by garage ID-------------

  @HandleError('Failed to update garage status', 'Garage')
  async updateStatus(
    garageId: string,
    dto: UpdateGarageStatusDto,
  ): Promise<TResponse<any>> {
    // ----------- Find the garage by ID-----------------
    const garage = await this.prisma.garage.findUnique({
      where: { id: garageId },
      include: { user: true },
    });

    if (!garage) {
      throw new NotFoundException(`Garage with ID ${garageId} not found. Please verify the garage ID.`);
    }

    //------------- Map User GarageStatus to Garage Status enum----------------
    let garageRecordStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
    if (dto.garageStatus === 'APPROVE') {
      garageRecordStatus = 'APPROVED';
    } else if (dto.garageStatus === 'DECLINE') {
      garageRecordStatus = 'REJECTED';
    }

    // ------------------Update the garage status-------------------
    const updatedGarage = await this.prisma.garage.update({
      where: { id: garageId },
      data: { status: garageRecordStatus },
    });

    //------------- Update garage owner information and trial if approved----------------
    let trialData = {};
    if (dto.garageStatus === 'APPROVE' && !garage.user.isTrialActive) {
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

    // ------------------Update garage owner status + trial info if needed-------------------
    const updatedUser = await this.prisma.user.update({
      where: { id: garage.userId },
      data: {
        garageStatus: dto.garageStatus,
        isGarageVerified: dto.garageStatus === 'APPROVE',
        ...trialData,
      },
    });

    // -------------------------------------
    // ------------------- Send email on approval -----------------------
    // -------------------------------------
    if (dto.garageStatus === 'APPROVE' && updatedUser.email) {
      await this.mail.sendEmail(
        updatedUser.email,
        'Your Garage Has Been Approved!',
        GarageAcceptEmailTemplate({
          name: updatedUser.fullName ?? undefined,
          garageName: garage.name ?? undefined,
        }),
      );
    }
    
    return successResponse(
      {
        garage: updatedGarage,
        owner: {
          id: updatedUser.id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          garageStatus: updatedUser.garageStatus,
          isGarageVerified: updatedUser.isGarageVerified,
        },
      },
      'Garage status updated successfully',
    );
  }

  // -------Update garage status by garage ID (not user ID)-------------
  @HandleError('Failed to update garage status by garage ID', 'Garage')
  async updateGarageStatusByGarageId(
    garageId: string,
    dto: UpdateGarageStatusDto,
  ): Promise<TResponse<any>> {
    // ----------- Find the specific garage-----------------
    const garage = await this.prisma.garage.findUnique({
      where: { id: garageId },
      include: { user: true },
    });
    if (!garage) throw new NotFoundException('Garage not found');

    //------------- Map User GarageStatus to Garage Status enum----------------
    let garageRecordStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
    if (dto.garageStatus === 'APPROVE') {
      garageRecordStatus = 'APPROVED';
    } else if (dto.garageStatus === 'DECLINE') {
      garageRecordStatus = 'REJECTED';
    }

    // ------------------Update the specific garage status-------------------
    const updatedGarage = await this.prisma.garage.update({
      where: { id: garageId },
      data: { status: garageRecordStatus },
    });

    // ------------------Update user status and trial if first approval-------------------
    if (dto.garageStatus === 'APPROVE') {
      let trialData = {};
      if (!garage.user.isTrialActive) {
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

      await this.prisma.user.update({
        where: { id: garage.userId },
        data: {
          garageStatus: dto.garageStatus,
          isGarageVerified: true,
          ...trialData,
        },
      });

      // ------------------- Send email on approval -----------------------
      if (garage.user.email) {
        await this.mail.sendEmail(
          garage.user.email,
          'Your Garage Has Been Approved!',
          GarageAcceptEmailTemplate({
            name: garage.user.fullName ?? undefined,
            garageName: garage.name ?? undefined,
          }),
        );
      }
    } else {
      // Update user status for DECLINE/PENDING
      await this.prisma.user.update({
        where: { id: garage.userId },
        data: { garageStatus: dto.garageStatus },
      });
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
