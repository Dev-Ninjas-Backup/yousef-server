import { PartialType } from '@nestjs/swagger';
import { CreatePlatformSubscribeDto } from './create-platform-subscribe.dto';

export class UpdatePlatformSubscribeDto extends PartialType(CreatePlatformSubscribeDto) {}
