import { PartialType } from '@nestjs/swagger';
import { CreatePartsCategoryDto } from './create-parts-category.dto';

export class UpdatePartsCategoryDto extends PartialType(
  CreatePartsCategoryDto,
) {}
