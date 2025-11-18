import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ValidateSuperAdmin } from 'src/common/jwt/jwt.decorator';
import { UpdateAdminSettingDto } from '../dto/update-admin-setting.dto';
import { AdminSettingService } from '../service/admin-setting.service';
@ApiTags('Admin-Settings => Approval setting, parts category')
@Controller('admin-setting')
export class AdminSettingController {
  constructor(private readonly adminSettingService: AdminSettingService) {}
  // ------------- Approval settings -----------

  // ---------auto approval setting garage -----------
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @Patch('auto-approval-garages')
  autoApprovalSettingGarage() {
    return this.autoApprovalSettingGarage();
  }

  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @Patch('email-notification/:id')
  updateEmailNotificationForUser(
    @Param('id') userId: string,
    @Body('isEmailNotification') isEmailNotification: boolean,
  ) {
    return this.adminSettingService.updateEmailNotificationForUser(
      userId,
      isEmailNotification,
    );
  }

  @Patch('approval-garages/:id')
  updateApprovalSettingGarage(
    @Param('id') id: string,
    @Body() updateAdminSettingDto: UpdateAdminSettingDto,
  ) {
    return this.adminSettingService.update(+id, updateAdminSettingDto);
  }

  @Get()
  findAll() {
    return this.adminSettingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminSettingService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAdminSettingDto: UpdateAdminSettingDto,
  ) {
    return this.adminSettingService.update(+id, updateAdminSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminSettingService.remove(+id);
  }
}
