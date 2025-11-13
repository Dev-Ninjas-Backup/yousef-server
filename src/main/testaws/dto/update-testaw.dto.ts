import { PartialType } from '@nestjs/swagger';
import { CreateTestawDto } from './create-testaw.dto';

export class UpdateTestawDto extends PartialType(CreateTestawDto) {}
