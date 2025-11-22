import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { ENVEnum } from 'src/common/enum/env.enum';
import { AppError } from 'src/common/error/handle-error.app';
import { HandleError } from 'src/common/error/handle-error.decorator';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { S3FileService } from 'src/lib/s3file/s3file.service';
import { CreateGarageDto } from '../dto/create-garage.dto';
import { QueryGarageDto } from '../dto/query-garage.dto';
import { UpdateGarageDto } from '../dto/update-garage.dto';


@Injectable()
export class GarageService {
  constructor(
    private prisma: PrismaService,
    private s3FileService: S3FileService,
    private configService: ConfigService
  ) { }

  @HandleError('Failed to create garage', 'Garage')
  async create(
    userId: string,
    createGarageDto: CreateGarageDto,
    files: {
      coverPhoto?: Express.Multer.File;
      profileImage?: Express.Multer.File;
    } = {},
  ): Promise<TResponse<any>> {
    let coverPhotoUrl: string | undefined;
    let profileImageUrl: string | undefined;

    // Process coverPhoto
    if (files.coverPhoto) {
      try {
        const { url } = await this.s3FileService.processUploadedFile(
          files.coverPhoto,
        );
        coverPhotoUrl = url;
      } catch (error) {
        throw new Error(`Failed to upload coverPhoto to S3: ${error.message}`);
      }
    }

    // Process profileImage
    if (files.profileImage) {
      try {
        const { url } = await this.s3FileService.processUploadedFile(
          files.profileImage,
        );
        profileImageUrl = url;
      } catch (error) {
        throw new Error(
          `Failed to upload profileImage to S3: ${error.message}`,
        );
      }
    }

    // Process brand expertise
    const brandArray = createGarageDto.brandExpertise
      ? createGarageDto.brandExpertise.split(',').map((b) => b.trim())
      : [];

    // Process certifications
    const certificationsArray = createGarageDto.certifications
      ? createGarageDto.certifications.split(',').map((b) => b.trim())
      : [];

    // Check if garage name already exists
    const existingGarage = await this.prisma.garage.findFirst({
      where: {
        name: {
          equals: createGarageDto.name.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existingGarage) {
      throw new AppError(409, 'Garage with this name already exists');
    }

    // Create garage data object for Prisma
    const garageData = {
      name: createGarageDto.name.trim(),
      coverPhoto: coverPhotoUrl,
      profileImage: profileImageUrl,
      garagePhone: createGarageDto.phone,
      email: createGarageDto.email,
      street: createGarageDto.street,
      city: createGarageDto.city,
      emirate: createGarageDto.emirate,
      address: createGarageDto.address,
      description: createGarageDto.description,
      certifications: certificationsArray,
      weekdaysHours: createGarageDto.weekdaysHours,
      weekendsHours: createGarageDto.weekendsHours,
      brandExpertise: brandArray,
      userId: userId,
    };

    // Save to database
    const garage = await this.prisma.garage.create({
      data: garageData,
    });

    return successResponse(garage, 'Garage created successfully');
  }

  @HandleError('Failed to update garage', 'Garage')
  async update(
    userId: string,
    id: string,
    updateGarageDto: UpdateGarageDto,
    files: {
      coverPhoto?: Express.Multer.File;
      profileImage?: Express.Multer.File;
    } = {},
  ): Promise<TResponse<any>> {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new AppError(404, 'Garage not found');

    const isUser = await this.prisma.user.findUnique({ where: { id: userId } });

    if (userId !== garage.userId && isUser?.role !== UserRole.SUPER_ADMIN) {
      throw new AppError(403, 'You are not authorized to update this garage');
    }

    // Check if garage name already exists (excluding current garage)
    if (updateGarageDto.name) {
      const duplicateGarage = await this.prisma.garage.findFirst({
        where: {
          name: {
            equals: updateGarageDto.name.trim(),
            mode: 'insensitive',
          },
          NOT: { id },
        },
      });

      if (duplicateGarage) {
        throw new AppError(409, 'Garage with this name already exists');
      }
    }

    let coverPhotoUrl: string | undefined;
    let profileImageUrl: string | undefined;

    // Process coverPhoto
    if (files.coverPhoto) {
      try {
        const { url } = await this.s3FileService.processUploadedFile(
          files.coverPhoto,
        );
        coverPhotoUrl = url;
      } catch (error) {
        throw new Error(`Failed to upload coverPhoto to S3: ${error.message}`);
      }
    }

    // Process profileImage
    if (files.profileImage) {
      try {
        const { url } = await this.s3FileService.processUploadedFile(
          files.profileImage,
        );
        profileImageUrl = url;
      } catch (error) {
        throw new Error(
          `Failed to upload profileImage to S3: ${error.message}`,
        );
      }
    }

    // Process brand expertise
    const brandArray = updateGarageDto.brandExpertise
      ? updateGarageDto.brandExpertise.split(',').map((b) => b.trim())
      : undefined;

    // Process certifications
    const certificationsArray = updateGarageDto.certifications
      ? updateGarageDto.certifications.split(',').map((b) => b.trim())
      : [];

    // Create update data object for Prisma
    const updateData: any = {
      ...updateGarageDto,
      name: updateGarageDto.name?.trim(),
      garagePhone: updateGarageDto.phone,
    };
    if (coverPhotoUrl) updateData.coverPhoto = coverPhotoUrl;
    if (profileImageUrl) updateData.profileImage = profileImageUrl;
    if (brandArray) updateData.brandExpertise = brandArray;
    if (certificationsArray) updateData.certifications = certificationsArray;

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    // Update database
    const updatedGarage = await this.prisma.garage.update({
      where: { id },
      data: updateData,
    });

    return successResponse(updatedGarage, 'Garage updated successfully');
  }

  @HandleError('Failed to fetch garages', 'Garage')
  async findAll(query?: QueryGarageDto): Promise<TResponse<any>> {
    const page = parseInt(query?.page || '1');
    const limit = parseInt(query?.limit || '10');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
        { emirate: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    if (query?.emirate) {
      where.emirate = { contains: query.emirate, mode: 'insensitive' };
    }

    if (query?.serviceName) {
      where.services = {
        some: {
          service: {
            name: {
              contains: query.serviceName,
              mode: 'insensitive',
            },
          },
        },
      };
    }

    const [garages, total] = await Promise.all([
      this.prisma.garage.findMany({
        where,
        include: {
          services: {
            select: {
              service: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              bio: true,
              phone: true,
              profilePhoto: true,
              city: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.garage.count({ where }),
    ]);

    // Transform the response to simplify the services array
    const transformedGarages = garages.map((garage) => ({
      ...garage,
      services: garage.services.map((gs) => gs.service),
    }));

    const result = {
      data: transformedGarages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return successResponse(result, 'Garages retrieved successfully');
  }

  @HandleError('Failed to fetch garage', 'Garage')
  async findOne(id: string): Promise<TResponse<any>> {
    const garage = await this.prisma.garage.findUnique({
      where: { id },
      include: {
        services: {
          select: {
            service: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            bio: true,
            phone: true,
            profilePhoto: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!garage) throw new AppError(404, 'Garage not found');

    // Transform the response to simplify the services array
    const transformedGarage = {
      ...garage,
      services: garage.services.map((gs) => gs.service),
    };

    return successResponse(transformedGarage, 'Garage retrieved successfully');
  }
  @HandleError('Failed to delete garage', 'Garage')
  async remove(userId: string, id: string): Promise<TResponse<any>> {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new AppError(404, 'Garage not found');

    const isUser = await this.prisma.user.findUnique({ where: { id: userId } });

    if (userId !== garage.userId && isUser?.role !== UserRole.SUPER_ADMIN) {
      throw new AppError(403, 'You are not authorized to delete this garage');
    }

    await this.prisma.garage.delete({ where: { id } });
    return successResponse(null, 'Garage deleted successfully');
  }


  // ---------------- Garage Management --------------
  // @HandleError('Failed to create garage', 'Garage')
  // async locationcreate(
  //   userId: string,
  //   createGarageDto: CreateGarageDto,
  //   files: {
  //     coverPhoto?: Express.Multer.File;
  //     profileImage?: Express.Multer.File;
  //   } = {},
  // ): Promise<TResponse<any>> {
  //   let coverPhotoUrl: string | undefined;
  //   let profileImageUrl: string | undefined;

  //   // Upload coverPhoto
  //   if (files.coverPhoto) {
  //     const { url } = await this.s3FileService.processUploadedFile(files.coverPhoto);
  //     coverPhotoUrl = url;
  //   }

  //   // Upload profileImage
  //   if (files.profileImage) {
  //     const { url } = await this.s3FileService.processUploadedFile(files.profileImage);
  //     profileImageUrl = url;
  //   }

  //   // Brand Expertise
  //   const brandArray = createGarageDto.brandExpertise
  //     ? createGarageDto.brandExpertise.split(',').map((b) => b.trim())
  //     : [];

  //   // Certifications
  //   const certificationsArray = createGarageDto.certifications
  //     ? createGarageDto.certifications.split(',').map((b) => b.trim())
  //     : [];

  //   // Check for duplicate name
  //   const existingGarage = await this.prisma.garage.findFirst({
  //     where: {
  //       name: { equals: createGarageDto.name.trim(), mode: 'insensitive' },
  //     },
  //   });

  //   if (existingGarage) {
  //     throw new AppError(409, 'Garage with this name already exists');
  //   }

  //   // ===============================
  //   // AUTO GENERATE LAT & LNG
  //   // ===============================
  //   const fullAddress = `${createGarageDto.street ?? ''}, ${createGarageDto.city ?? ''}, ${createGarageDto.emirate ?? ''}`
  //     .replace(/, ,/g, ',')
  //     .trim();

  //   let lat: number | null = null;
  //   let lng: number | null = null;

  //   if (fullAddress.length > 3) {
  //     const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
  //       fullAddress,
  //     )}&key=${this.configService.get<string>(ENVEnum.GOOGLE_MAPS_API_KEY)}`;

  //     const response = await fetch(geoUrl);
  //     const data = await response.json();

  //     if (data.status === 'OK' && data.results.length > 0) {
  //       lat = data.results[0].geometry.location.lat;
  //       lng = data.results[0].geometry.location.lng;
  //     }
  //   }

  //   // ===============================
  //   // Prepare database data
  //   // ===============================
  //   const garageData = {
  //     name: createGarageDto.name.trim(),
  //     coverPhoto: coverPhotoUrl,
  //     profileImage: profileImageUrl,
  //     garagePhone: createGarageDto.phone,
  //     email: createGarageDto.email,
  //     street: createGarageDto.street,
  //     city: createGarageDto.city,
  //     emirate: createGarageDto.emirate,
  //     address: createGarageDto.address,
  //     description: createGarageDto.description,
  //     certifications: certificationsArray,
  //     weekdaysHours: createGarageDto.weekdaysHours,
  //     weekendsHours: createGarageDto.weekendsHours,
  //     brandExpertise: brandArray,
  //     userId: userId,

  //     // === Auto generated ===
  //     garageLat: lat ?? undefined,
  //     garageLng: lng ?? undefined,
  //   };

  //   // Save
  //   const garage = await this.prisma.garage.create({ data: garageData });

  //   return successResponse(garage, 'Garage created successfully');
  // }

}
