import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateSparepartsFinancialDto } from '../dto/create-spareparts-financial.dto';
import { UpdateSparepartsFinancialDto } from '../dto/update-spareparts-financial.dto';
import { SparepartsFinancialsService } from '../service/spareparts-financials.service';
@ApiTags('Admin-Spareparts-Financials')
@Controller('spareparts-financials')
export class SparepartsFinancialsController {
  constructor(
    private readonly sparepartsFinancialsService: SparepartsFinancialsService,
  ) {}

  @Post()
  create(@Body() createSparepartsFinancialDto: CreateSparepartsFinancialDto) {
    return this.sparepartsFinancialsService.create(
      createSparepartsFinancialDto,
    );
  }

  @Get()
  findAll() {
    return this.sparepartsFinancialsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sparepartsFinancialsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSparepartsFinancialDto: UpdateSparepartsFinancialDto,
  ) {
    return this.sparepartsFinancialsService.update(
      +id,
      updateSparepartsFinancialDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sparepartsFinancialsService.remove(+id);
  }
}
