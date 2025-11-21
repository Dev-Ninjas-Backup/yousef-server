import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ValidateAdmin } from 'src/common/jwt/jwt.decorator';
import { UpdateSparepartsDto } from '../dto/UpdateSpareparts.dto';
import { SparepartsFinancialsService } from '../service/spareparts-financials.service';
@ApiTags('Admin-Spareparts-Financials')
@Controller('spareparts-financials')
export class SparepartsFinancialsController {
  constructor(
    private readonly sparepartsFinancialsService: SparepartsFinancialsService,
  ) {}

  //  -------------admin approve spareparts --------------
  // Admin approve spareparts (optional dto to change status)
  @ApiBearerAuth()
  @ValidateAdmin()
  @ApiOperation({ summary: 'Approve spareparts' })
  @Patch('parts/approve/:id')
  async updateSparepartsStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSparepartsDto,
  ) {
    return this.sparepartsFinancialsService.updateSparepartsStatus(id, dto);
  }

  // Admin delete spareparts
  @ApiBearerAuth()
  @ValidateAdmin()
  @ApiOperation({ summary: 'Delete spareparts' })
  @Delete('parts/remove/:id')
  async removeParts(@Param('id') id: string) {
    return this.sparepartsFinancialsService.removeParts(id);
  }
}
