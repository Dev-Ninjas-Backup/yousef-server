import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ValidateAuth, ValidateSuperAdmin } from 'src/common/jwt/jwt.decorator';
import { UserManagementService } from '../service/user-management.service';

@Controller('user-management')
@ApiTags('Admin-User-Management')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  // ------------get all user ---
  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({
    summary: 'get all user access admin only ',
  })
  @Get()
  async getAllUsers() {
    return this.userManagementService.getAllUsers();
  }
  // ----------admin get specific user with id wise seen --
  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({
    summary: 'get specific user access admin only ',
  })
  @Get('user/:id')
  findOne(@Param('id') id: string) {
    return this.userManagementService.getUser(id);
  }

  // ---------soft delete user ---
  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({
    summary: 'soft delete user access admin only ',
  })
  @Delete('user/:id')
  remove(@Param('id') id: string) {
    return this.userManagementService.remove(id);
  }
}
