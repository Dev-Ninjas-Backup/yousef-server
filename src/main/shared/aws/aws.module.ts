import { Global, Module } from '@nestjs/common';
import { awsService } from './aws.service';
import { awsController } from './aws.controller';
import { AdditionalS3Service } from './additional/additional.service';
import { AdditionalS3Controller } from './additional/additional.controller';

@Global()
@Module({
  providers: [awsService, AdditionalS3Service],
  exports: [awsService, AdditionalS3Service],
  controllers: [awsController, AdditionalS3Controller],
})
export class awsModule {}
