import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ValidateGarageOwner } from 'src/common/jwt/jwt.decorator';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/approved-products')
  @ValidateGarageOwner()
  @ApiOperation({ summary: 'Get all approved products' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved approved products',
  })
  async getAllApprovedProducts() {
    return await this.notificationService.getAllApprovedProducts();
  }
}
