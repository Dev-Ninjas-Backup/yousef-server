import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
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

  // --------------------------financials overview-----------------------------

  // Track revenue, payments, and transactions
  @ApiTags('Admin-Financials')
  @ApiBearerAuth()
  @ValidateAdmin()
  @ApiOperation({ summary: 'Track revenue, payments, and transactions' })
  @Get('financial-overview')
  async FinancialOverview() {
    return this.sparepartsFinancialsService.FinancialOverview();
  }

  // -----------------Revenue & Transactions-----------------
  @ApiTags('Admin-Financials')
  @ApiBearerAuth()
  @ValidateAdmin()
  @ApiOperation({ summary: 'Revenue & Transactions overview chart data' })
  @Get('revenue-transactions')
  async RevenueTransactions() {
    return this.sparepartsFinancialsService.RevenueTransactions();
  }
  // ----------------------------- RECENT TRANSACTIONS -------------------------
  @ApiTags('Admin-Financials')
  @ApiBearerAuth()
  @ValidateAdmin()
  @ApiOperation({ summary: 'Recent Transactions' })
  @Get('recent-transactions')
  async RecentTransactions() {
    return this.sparepartsFinancialsService.RecentTransactions();
  }

  // -----------Last 30 all data export-----------
  @ApiTags('Admin-Financials')
  @ApiBearerAuth()
  @ValidateAdmin()
  @ApiOperation({ summary: 'Last 30 all data export' })
  @Get('last-30-all-data')
  async Last30AllDataExport() {
    return this.sparepartsFinancialsService.Last30AllDataExport();
  }
}
