import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { S3FileService } from 'src/lib/s3file/s3file.service';
import { CreateServiceTypeDto } from '../dto/create-service.dto';
import { UpdateServiceTypeDto } from '../dto/update-service.dto';

@Injectable()
export class ServiceTypeService {
  constructor(
    private prisma: PrismaService,
    private s3FileService: S3FileService,
  ) {}

  // CREATE SERVICE
  async create(
    dto: CreateServiceTypeDto,
    files: { icon?: Express.Multer.File } = {},
    user: any,
  ) {
    // Authorization check
    if (
      user.roles !== UserRole.SUPER_ADMIN &&
      user.roles !== UserRole.GARAGE_OWNER
    ) {
      throw new ForbiddenException(
        'Only admins and garage owners can create services',
      );
    }

    let iconUrl: string | undefined;
    if (files.icon) {
      try {
        const { url } = await this.s3FileService.processUploadedFile(
          files.icon,
        );
        iconUrl = url;
      } catch (error) {
        throw new Error(`Failed to upload icon to S3: ${error.message}`);
      }
    }

    // Start a transaction to ensure atomicity
    return this.prisma.$transaction(async (prisma) => {
      // Create the service
      const service = await prisma.service.create({
        data: {
          icon: iconUrl || '',
          name: dto.name,
        },
      });

      // If the user is a GARAGE_OWNER, link the service to their garage
      if (user.roles === UserRole.GARAGE_OWNER) {
        // Find the garage owned by the user
        const garage = await prisma.garage.findFirst({
          where: { userId: user.id },
        });

        if (!garage) {
          throw new NotFoundException('No garage found for this user');
        }

        // Link the service to the garage via GarageService
        await prisma.garageService.create({
          data: {
            garageId: garage.id,
            serviceId: service.id,
          },
        });
      }

      return service;
    });
  }

  // GET ALL SERVICES
  async findAll() {
    return this.prisma.service.findMany({
      include: {
        garages: {
          include: {
            garage: true,
          },
        },
      },
    });
  }

  // GET SERVICE BY ID
  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        garages: {
          include: {
            garage: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  // UPDATE SERVICE
  async update(
    id: string,
    dto: UpdateServiceTypeDto,
    files: { icon?: Express.Multer.File } = {},
    user: any,
  ) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');

    if (
      user.roles !== UserRole.SUPER_ADMIN &&
      user.roles !== UserRole.GARAGE_OWNER
    ) {
      throw new ForbiddenException(
        'Only admins and garage owners can update services',
      );
    }

    // Check if GARAGE_OWNER has access to this service via a garage they own
    if (user.roles === UserRole.GARAGE_OWNER) {
      const hasAccess = await this.prisma.garageService.findFirst({
        where: { serviceId: id, garage: { userId: user.id } },
      });
      if (!hasAccess) {
        throw new ForbiddenException(
          'Garage owner can only update services linked to their garages',
        );
      }
    }

    let iconUrl: string | undefined = service.icon; // Retain existing icon if no new file
    if (files.icon) {
      try {
        const { url } = await this.s3FileService.processUploadedFile(
          files.icon,
        );
        iconUrl = url;
      } catch (error) {
        throw new Error(`Failed to upload icon to S3: ${error.message}`);
      }
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (iconUrl) updateData.icon = iconUrl;

    return this.prisma.service.update({
      where: { id },
      data: updateData,
    });
  }

  // DELETE SERVICE
  async remove(id: string, user: any) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');

    if (user.roles !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only admins can delete services');
    }

    return this.prisma.service.delete({ where: { id } });
  }
}
