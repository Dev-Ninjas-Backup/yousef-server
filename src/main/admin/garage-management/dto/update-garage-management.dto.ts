import { PartialType } from '@nestjs/swagger';
import { CreateGarageManagementDto } from './create-garage-management.dto';

export class UpdateGarageManagementDto extends PartialType(CreateGarageManagementDto) {}
