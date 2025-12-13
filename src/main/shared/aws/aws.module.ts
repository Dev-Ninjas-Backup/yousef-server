import { Global, Module } from '@nestjs/common';

import { AdditionalS3Service } from './additional/additional.service';
import { AdditionalS3Controller } from './additional/additional.controller';

@Global()
@Module({
  providers: [AdditionalS3Service],
  exports: [ AdditionalS3Service],
  controllers: [ AdditionalS3Controller],
})
export class awsModule {}
