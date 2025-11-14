import { PartialType } from '@nestjs/swagger';
import { CreateAdminMessageDto } from './create-admin-message.dto';

export class UpdateAdminMessageDto extends PartialType(CreateAdminMessageDto) {}
