import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CreatePartsCategoryDto } from './dto/create-parts-category.dto';
import { UpdatePartsCategoryDto } from './dto/update-parts-category.dto';

@Injectable()
export class PartsCategoryService {
    constructor(private prisma: PrismaService) { }

    async create(createPartsCategoryDto: CreatePartsCategoryDto) {
        return this.prisma.partsCategory.create({ data: createPartsCategoryDto });
    }

    async findAll() {
        return this.prisma.partsCategory.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async findOne(id: string) {
        const category = await this.prisma.partsCategory.findUnique({
            where: { id }
        });
        if (!category) {
            throw new NotFoundException('Parts category not found');
        }
        return category;
    }

    async update(id: string, updatePartsCategoryDto: UpdatePartsCategoryDto) {
        await this.findOne(id);
        return this.prisma.partsCategory.update({
            where: { id },
            data: updatePartsCategoryDto
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.partsCategory.delete({
            where: { id }
        });
    }
}
