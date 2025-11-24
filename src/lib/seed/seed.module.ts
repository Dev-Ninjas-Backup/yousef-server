import { Global, Module } from '@nestjs/common';
import { FileService } from './service/file.service';
import { PaymentConfigureService } from './service/paymentconfigure.service';
import { SuperAdminService } from './service/super-admin.service';

@Global()
@Module({
  imports: [],
  providers: [SuperAdminService, FileService, PaymentConfigureService],
})
export class SeedModule {}
