import { Injectable } from '@nestjs/common';
import { AppError } from 'src/common/error/handle-error.app';
import { HandleError } from 'src/common/error/handle-error.decorator';
import {
  successResponse,
  TResponse,
} from 'src/common/utilsResponse/response.util';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CreatePartsCategoryDto } from './dto/create-parts-category.dto';
import { QueryPartsCategoryDto } from './dto/query-parts-category.dto';
import { UpdatePartsCategoryDto } from './dto/update-parts-category.dto';

@Injectable()
export class PartsCategoryService {
  constructor(private prisma: PrismaService) { }

  @HandleError('Failed to create parts category', 'Parts Category')
  async create(
    createPartsCategoryDto: CreatePartsCategoryDto,
  ): Promise<TResponse<any>> {
    const existingCategory = await this.prisma.partsCategory.findFirst({
      where: {
        name: {
          equals: createPartsCategoryDto.name.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existingCategory) {
      throw new AppError(409, 'Parts category with this name already exists');
    }

    const category = await this.prisma.partsCategory.create({
      data: {
        name: createPartsCategoryDto.name.trim(),
      },
    });
    return successResponse(category, 'Parts category created successfully');
  }

  @HandleError('Failed to fetch parts categories', 'Parts Category')
  async findAll(query?: QueryPartsCategoryDto): Promise<TResponse<any>> {
    const page = parseInt(query?.page || '1');
    const limit = parseInt(query?.limit || '10');
    const skip = (page - 1) * limit;

    const where = query?.search
      ? {
        name: {
          contains: query.search,
          mode: 'insensitive' as const,
        },
      }
      : {};

    const [categories, total] = await Promise.all([
      this.prisma.partsCategory.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.partsCategory.count({ where }),
    ]);

    const result = {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return successResponse(result, 'Parts categories retrieved successfully');
  }

  @HandleError('Failed to fetch parts category', 'Parts Category')
  async findOne(id: string): Promise<TResponse<any>> {
    const category = await this.prisma.partsCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new AppError(404, 'Parts category not found');
    }
    return successResponse(category, 'Parts category retrieved successfully');
  }

  @HandleError('Failed to update parts category', 'Parts Category')
  async update(
    id: string,
    updatePartsCategoryDto: UpdatePartsCategoryDto,
  ): Promise<TResponse<any>> {
    const existingCategory = await this.prisma.partsCategory.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      throw new AppError(404, 'Parts category not found');
    }

    if (updatePartsCategoryDto.name) {
      const duplicateCategory = await this.prisma.partsCategory.findFirst({
        where: {
          name: {
            equals: updatePartsCategoryDto.name.trim(),
            mode: 'insensitive',
          },
          NOT: { id },
        },
      });

      if (duplicateCategory) {
        throw new AppError(409, 'Parts category with this name already exists');
      }
    }

    const updatedCategory = await this.prisma.partsCategory.update({
      where: { id },
      data: {
        ...updatePartsCategoryDto,
        name: updatePartsCategoryDto.name?.trim() || existingCategory.name,
      },
    });
    return successResponse(
      updatedCategory,
      'Parts category updated successfully',
    );
  }

  @HandleError('Failed to delete parts category', 'Parts Category')
  async remove(id: string): Promise<TResponse<any>> {
    const existingCategory = await this.prisma.partsCategory.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      throw new AppError(404, 'Parts category not found');
    }

    await this.prisma.partsCategory.delete({
      where: { id },
    });
    return successResponse(null, 'Parts category deleted successfully');
  }

  @HandleError('Failed to fetch parts category statistics', 'Parts Category')
  async getStatistics(): Promise<TResponse<any>> {
    // Get total product count
    const totalProducts = await this.prisma.product.count();

    // Get product count by category
    const categoryStats = await this.prisma.product.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'asc',
        },
      },
    });
    console.log(categoryStats);

    // Calculate percentages and format data
    const statistics = categoryStats.map((stat) => ({
      category: stat.category,
      productCount: stat._count.category,
      percentage: totalProducts > 0 ?
        parseFloat(((stat._count.category / totalProducts) * 100).toFixed(2)) : 0,
    }));

    const result = {
      totalProducts,
      categoryStatistics: statistics,
    };

    return successResponse(result, 'Parts category statistics retrieved successfully');
  }
}
