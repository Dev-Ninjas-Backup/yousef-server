import { PartialType } from '@nestjs/swagger';
import { CreateContactDto } from './create-subscribe.dto';

export class UpdateSubscribeDto extends PartialType(CreateContactDto) {}
