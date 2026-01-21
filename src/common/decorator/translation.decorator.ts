import { SetMetadata } from '@nestjs/common';

export const TranslateFields = (fields: string[]) =>
  SetMetadata('translate:fields', fields);

export const TranslateResponse = () => SetMetadata('translate:enabled', true);

export const SkipTranslation = () => SetMetadata('translate:skip', true);
