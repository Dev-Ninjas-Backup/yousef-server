import { Injectable } from '@nestjs/common';
import { HandleError } from 'src/common/error/handle-error.decorator';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { UpdateSparepartsDto } from '../dto/UpdateSpareparts.dto';

@Injectable()
export class SparepartsFinancialsService {
  // ------------------------- SparepartsFinancials ------------------------- //
  constructor(private readonly prisma: PrismaService) {}

  // Approve / Update spareparts status
  @HandleError('Failed to update spareparts')
  async updateSparepartsStatus(id: string, dto: UpdateSparepartsDto) {
    const spareparts = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!spareparts) {
      throw new Error('Spareparts not found');
    }

    // Update status dynamically based on DTO
    const updatedSpareparts = await this.prisma.product.update({
      where: { id },
      data: {
        status: dto.status, // now accepts any valid ProductStatus
      },
    });

    return updatedSpareparts;
  }

  // -------------Delete spareparts
  @HandleError('Failed to delete spareparts')
  async removeParts(id: string) {
    const spareparts = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!spareparts) {
      throw new Error('Spareparts not found');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Spareparts deleted successfully' };
  }
}
