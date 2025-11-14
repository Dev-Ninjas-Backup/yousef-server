import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PartsFinancialsService } from './parts-financials.service';
import { CreatePartsFinancialDto } from './dto/create-parts-financial.dto';
import { UpdatePartsFinancialDto } from './dto/update-parts-financial.dto';

@Controller('parts-financials')
export class PartsFinancialsController {
  constructor(
    private readonly partsFinancialsService: PartsFinancialsService,
  ) {}

  @Post()
  create(@Body() createPartsFinancialDto: CreatePartsFinancialDto) {
    return this.partsFinancialsService.create(createPartsFinancialDto);
  }

  @Get()
  findAll() {
    return this.partsFinancialsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partsFinancialsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePartsFinancialDto: UpdatePartsFinancialDto,
  ) {
    return this.partsFinancialsService.update(+id, updatePartsFinancialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partsFinancialsService.remove(+id);
  }
}
