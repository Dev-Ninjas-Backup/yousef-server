import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { S3FileService } from 'src/lib/s3file/s3file.service';
import { CreateGarageDto } from '../dto/create-garage.dto';
import { UpdateGarageDto } from '../dto/update-garage.dto';

@Injectable()
export class GarageService {
  constructor(
    private prisma: PrismaService,
    private s3FileService: S3FileService,
  ) {}

  // CREATE
  async create(
    createGarageDto: CreateGarageDto,
    files: {
      coverPhoto?: Express.Multer.File;
      profileImage?: Express.Multer.File;
    } = {},
  ) {
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

    // Create garage data object for Prisma
    const garageData = {
      name: createGarageDto.name,
      coverPhoto: coverPhotoUrl,
      profileImage: profileImageUrl,
      phone: createGarageDto.phone,
      email: createGarageDto.email,
      street: createGarageDto.street,
      city: createGarageDto.city,
      emirate: createGarageDto.emirate,
      description: createGarageDto.description,
      certifications: createGarageDto.certifications,
      weekdaysHours: createGarageDto.weekdaysHours,
      weekendsHours: createGarageDto.weekendsHours,
      brandExpertise: brandArray,
    };

    // Save to database
    return this.prisma.garage.create({
      data: garageData,
    });
  }

  // UPDATE
  async update(
    id: string,
    updateGarageDto: UpdateGarageDto,
    files: {
      coverPhoto?: Express.Multer.File;
      profileImage?: Express.Multer.File;
    } = {},
  ) {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException(`Garage with ID ${id} not found`);

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

    // Create update data object for Prisma
    const updateData: any = { ...updateGarageDto };
    if (coverPhotoUrl) updateData.coverPhoto = coverPhotoUrl;
    if (profileImageUrl) updateData.profileImage = profileImageUrl;
    if (brandArray) updateData.brandExpertise = brandArray;

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    // Update database
    return this.prisma.garage.update({
      where: { id },
      data: updateData,
    });
  }

  // GET ALL
  async findAll() {
    return this.prisma.garage.findMany({
      include: {
        services: { include: { service: true } },
      },
    });
  }

  // GET ONE
  async findOne(id: string) {
    const garage = await this.prisma.garage.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
      },
    });
    if (!garage) throw new NotFoundException(`Garage with ID ${id} not found`);
    return garage;
  }

  // DELETE
  async remove(id: string) {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException(`Garage with ID ${id} not found`);
    return this.prisma.garage.delete({ where: { id } });
  }
}
