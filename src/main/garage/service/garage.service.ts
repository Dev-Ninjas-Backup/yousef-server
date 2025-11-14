import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { S3FileService } from 'src/lib/s3file/s3file.service';
import { CreateGarageDto } from '../dto/create-garage.dto';
import { UpdateGarageDto } from '../dto/update-garage.dto';

@Injectable()
export class GarageService {
  constructor(
    private prisma: PrismaService,
    private s3FileService: S3FileService,
  ) { }

  // CREATE
  async create(
    userId: string,
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

    // Process certifications
    const certificationsArray = createGarageDto.certifications
      ? createGarageDto.certifications.split(',').map((b) => b.trim())
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
      certifications: certificationsArray,
      weekdaysHours: createGarageDto.weekdaysHours,
      weekendsHours: createGarageDto.weekendsHours,
      brandExpertise: brandArray,
      userId: userId,
    };

    // Save to database
    return this.prisma.garage.create({
      data: garageData,
    });
  }

  // UPDATE
  async update(
    userId: string,
    id: string,
    updateGarageDto: UpdateGarageDto,
    files: {
      coverPhoto?: Express.Multer.File;
      profileImage?: Express.Multer.File;
    } = {},
  ) {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException(`Garage with ID ${id} not found`);

    // if (userId !== garage.userId) {
    //   throw new Error('Forbidden!');
    // }

    const isUser = await this.prisma.user.findUnique({ where: { id: userId } });

    if (userId !== garage.userId && isUser?.role !== UserRole.SUPER_ADMIN) {
      throw new Error("You are not authorized this route!");
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
    const updateData: any = { ...updateGarageDto };
    if (coverPhotoUrl) updateData.coverPhoto = coverPhotoUrl;
    if (profileImageUrl) updateData.profileImage = profileImageUrl;
    if (brandArray) updateData.brandExpertise = brandArray;
    if (certificationsArray) updateData.certifications = certificationsArray;

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
        services: {
          include: {
            service: true, // Include all service details
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
            address: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  // GET ONE
  async findOne(id: string) {
    const garage = await this.prisma.garage.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true, // Include all service details
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
            address: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
          // omit: {
          //   password: true
          // }
        },
      },
    });
    if (!garage) throw new NotFoundException(`Garage with ID ${id} not found`);
    return garage;
  }

  // DELETE
  async remove(userId: string, id: string) {
    const isExist = await this.prisma.garage.findUnique({ where: { id } });
    if (!isExist) throw new NotFoundException(`Garage with ID ${id} not found`);
    console.log('Matched', userId, isExist.userId);

    // if (userId !== isExist.userId) {
    //   throw new Error('Forbidden!');
    // }

    const isUser = await this.prisma.user.findUnique({ where: { id: userId } });

    if (userId !== isExist.userId && isUser?.role !== UserRole.SUPER_ADMIN) {
      throw new Error("You are not authorized this route!");
    }

    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException(`Garage with ID ${id} not found`);
    return this.prisma.garage.delete({ where: { id } });
  }
}