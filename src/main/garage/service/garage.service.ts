import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CreateGarageDto } from '../dto/create-garage.dto';
import { UpdateGarageDto } from '../dto/update-garage.dto';

@Injectable()
export class GarageService {
  constructor(private prisma: PrismaService) { }

  // CREATE
  async create(createGarageDto: CreateGarageDto) {
    const brandArray = createGarageDto.brandExpertise
      ? createGarageDto.brandExpertise.split(',').map(b => b.trim())
      : [];

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
        weekdaysHours: createGarageDto.weekdaysHours,
        weekendsHours: createGarageDto.weekendsHours,
        brandExpertise: brandArray,
      },
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

  // UPDATE
  async update(id: string, updateGarageDto: UpdateGarageDto) {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException(`Garage with ID ${id} not found`);

    const data: any = { ...updateGarageDto };

    if (updateGarageDto.brandExpertise) {
      data.brandExpertise = updateGarageDto.brandExpertise.split(',').map(b => b.trim());
    }

    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return this.prisma.garage.update({ where: { id }, data });
  }

  // DELETE
  async remove(id: string) {
    const garage = await this.prisma.garage.findUnique({ where: { id } });
    if (!garage) throw new NotFoundException(`Garage with ID ${id} not found`);
    return this.prisma.garage.delete({ where: { id } });
  }
}
