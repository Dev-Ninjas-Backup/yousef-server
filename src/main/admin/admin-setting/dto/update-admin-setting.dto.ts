import { PartialType } from '@nestjs/swagger';
import { CreateAdminSettingDto } from './create-admin-setting.dto';

export class UpdateAdminSettingDto extends PartialType(CreateAdminSettingDto) {}
