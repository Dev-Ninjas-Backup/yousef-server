import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CreateServiceTypeDto } from '../dto/create-service.dto';
import { UpdateServiceTypeDto } from '../dto/update-service.dto';

@Injectable()
export class ServiceTypeService {
  constructor(private prisma: PrismaService) {}

  // CREATE SERVICE
  async create(dto: CreateServiceTypeDto) {
    return this.prisma.service.create({
      data: {
        icon: dto.icon,
        name: dto.name,
      },
    });
  }

  // GET ALL SERVICES
  async findAll() {
    return this.prisma.service.findMany({
      include: {
        garages: true, // show garage relations
      },
    });
  }

  // GET SERVICE BY ID
  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        garages: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  // UPDATE SERVICE
  async update(id: string, dto: UpdateServiceTypeDto) {
    const exists = await this.prisma.service.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Service not found');

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  // DELETE SERVICE
  async remove(id: string) {
    const exists = await this.prisma.service.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Service not found');

    return this.prisma.service.delete({ where: { id } });
  }
}
