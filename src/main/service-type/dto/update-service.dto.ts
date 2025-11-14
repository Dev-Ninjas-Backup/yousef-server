import { PartialType } from '@nestjs/swagger';
import { CreateServiceTypeDto } from './create-service.dto';

export class UpdateServiceTypeDto extends PartialType(CreateServiceTypeDto) {}
