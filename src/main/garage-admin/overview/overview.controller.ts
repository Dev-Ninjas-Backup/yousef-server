import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser, ValidateGarageOwner } from 'src/common/jwt/jwt.decorator';
import { OverviewService } from './overview.service';

@ApiTags('Garage Admin Overview')
@Controller('garage-admin-overview')
export class OverviewController {
    constructor(private readonly overviewService: OverviewService) { }

    @ApiBearerAuth()
    @ValidateGarageOwner()
    @ApiOperation({ summary: 'Get user overview statistics' })
    @Get('stats')
    async getUserOverview(@GetUser('userId') userId: string) {
        return this.overviewService.getUserOverview(userId);
    }

    @ApiBearerAuth()
    @ValidateGarageOwner()
    @ApiOperation({ summary: 'Get performance summary' })
    @Get('performance-summary')
    async getPerformanceSummary(@GetUser('userId') userId: string) {
        return this.overviewService.getPerformanceSummary(userId);
    }

    @ApiBearerAuth()
    @ValidateGarageOwner()
    @ApiOperation({ summary: 'Get recent Acitivity' })
    @Get('recent-activity')
    async getRecentActivity(@GetUser('userId') userId: string) {
        return this.overviewService.getRecentActivity(userId);
    }

    @ApiBearerAuth()
    @ValidateGarageOwner()
    @ApiOperation({ summary: 'Get recent listing' })
    @Get('recent-listings')
    async getRecentListings(@GetUser('userId') userId: string) {
        return this.overviewService.getRecentListings(userId);
    }
}
