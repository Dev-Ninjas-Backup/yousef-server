import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CreateGarageDto } from '../dto/create-garage.dto';
import { UpdateGarageDto } from '../dto/update-garage.dto';

@Injectable()
export class GarageService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(createGarageDto: CreateGarageDto) {
    return this.prisma.garage.create({
      data: {
        name: createGarageDto.name,
        coverPhoto: createGarageDto.coverPhoto,
        profileImage: createGarageDto.profileImage,
        phone: createGarageDto.phone,
        email: createGarageDto.email,
        street: createGarageDto.street,
        city: createGarageDto.city,
        emirate: createGarageDto.emirate,
        description: createGarageDto.description,
        certifications: createGarageDto.certifications,
      },
    });
  }

  // GET ALL
  async findAll() {
    return this.prisma.garage.findMany({
      include: {
        workingHours: true,
        services: { include: { service: true } },
        brandExpertise: { include: { brand: true } },
      },
    });
  }

  // GET ONE
  async findOne(id: string) {
    const garage = await this.prisma.garage.findUnique({
      where: { id },
      include: {
        workingHours: true,
        services: { include: { service: true } },
        brandExpertise: { include: { brand: true } },
      },
    });
    if (!garage) throw new NotFoundException(`Garage with ID ${id} not found`);
    return garage;
  }

  // UPDATE
  async update(id: string, updateGarageDto: UpdateGarageDto) {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException(`Garage with ID ${id} not found`);

    const data = Object.fromEntries(
      Object.entries(updateGarageDto).filter(([_, v]) => v !== undefined),
    );

    return this.prisma.garage.update({ where: { id }, data });
  }

  // DELETE
  async remove(id: string) {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException(`Garage with ID ${id} not found`);
    return this.prisma.garage.delete({ where: { id } });
  }
}
