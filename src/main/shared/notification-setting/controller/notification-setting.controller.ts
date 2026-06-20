import { Body, Controller, Delete, Get, Patch, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  GetUser,
  ValidateAuth,
  ValidateUser,
} from 'src/common/jwt/jwt.decorator';
import { TResponse } from 'src/common/utilsResponse/response.util';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { NotificationToggleDto } from '../dto/notification-toggle.dto';
import { NotificationSettingService } from '../service/notification-setting.service';

@ApiTags('Notification Setting')
@Controller('notification-setting')
export class NotificationSettingController {
  constructor(
    private readonly notificationSettingService: NotificationSettingService,
    private readonly prisma: PrismaService,
  ) {}
  @ValidateAuth()
  @ApiBearerAuth()
  @Get()
  async getNotificationSetting(
    @GetUser('userId') userId: string,
  ): Promise<TResponse<any>> {
    return await this.notificationSettingService.getNotificationSetting(userId);
  }
  @ValidateAuth()
  @ApiBearerAuth()
  @Get('all')
  async getAllNotificationSetting(): Promise<TResponse<any>> {
    return await this.notificationSettingService.getAllNotificationSetting();
  }
  // ------   update notification setting. -------
  @ValidateAuth()
  @ApiBearerAuth()
  @Patch()
  async updateNotificationSetting(
    @GetUser('userId') userId: string,
    @Body() dto: NotificationToggleDto,
  ): Promise<TResponse<any>> {
    return await this.notificationSettingService.updateNotificationSetting(
      userId,
      dto,
    );
  }

  // -------get all notification their own notification------
  @ApiBearerAuth()
  @ValidateUser()
  @ApiOperation({ summary: 'Get all notifications for the logged-in user' })
  @Get('all-notifications')
  async getAllNotifications(@GetUser('userId') userId: string) {
    return this.notificationSettingService.getAllNotifications(userId);
  }

  // ----------mark all notifications as read------------
  @ApiBearerAuth()
  @ValidateUser()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Patch('read-all')
  async markAllAsRead(@GetUser('userId') userId: string) {
    return this.notificationSettingService.markAllAsRead(userId);
  }

  // ----------mark single notification as read------------
  @ApiBearerAuth()
  @ValidateUser()
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @Patch('read/:id')
  async markAsRead(
    @GetUser('userId') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationSettingService.markAsRead(userId, notificationId);
  }

  // ----------delete all notifications------------
  @ApiBearerAuth()
  @ValidateUser()
  @ApiOperation({ summary: 'Delete all notifications for the logged-in user' })
  @Delete('delete-notification')
  async deleteAllNotification(@GetUser('userId') userId: string) {
    return this.notificationSettingService.deleteAllNotifications(userId);
  }
}
