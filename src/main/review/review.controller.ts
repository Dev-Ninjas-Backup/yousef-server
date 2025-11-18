import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ValidateAuth } from 'src/common/jwt/jwt.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

import { ReviewService } from './review.service';

@ApiTags('Review')
@Controller('review')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) { }

    @Post(':garageId')
    @ApiBearerAuth()
    @ValidateAuth()
    @ApiOperation({ summary: "Create a review for garage" })
    @ApiParam({ name: 'garageId', description: 'Garage ID' })
    @ApiBody({ type: CreateReviewDto })
    async create(@Param('garageId') garageId: string, @Body() createReviewDto: CreateReviewDto, @Req() req: any) {
        console.log("Request user", req);
        const userId = req.user?.userId;
        if (!userId) {
            throw new BadRequestException('User not authenticated');
        }
        return this.reviewService.create(garageId, createReviewDto, userId);
    }

    @Get('garage/:garageId')
    @ApiOperation({ summary: "Get all reviews for a garage" })
    @ApiParam({ name: 'garageId', description: 'Garage ID' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
    @ApiQuery({ name: 'rating', required: false, description: 'Filter by rating' })
    @ApiQuery({ name: 'search', required: false, description: 'Search in comments' })
    async findByGarage(@Param('garageId') garageId: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('rating') rating?: string, @Query('search') search?: string) {
        return this.reviewService.findByGarage(garageId, { page: +(page || 1), limit: +(limit || 10), rating: rating ? +rating : undefined, search });
    }

    @Get('user/my-reviews')
    @ApiBearerAuth()
    @ValidateAuth()
    @ApiOperation({ summary: "Get current user's reviews" })
    @ApiQuery({ name: 'page', required: false, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
    async findMyReviews(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new BadRequestException('User not authenticated');
        }
        return this.reviewService.findByUser(userId, { page: +(page || 1), limit: +(limit || 10) });
    }

    @Get(':id')
    @ApiOperation({ summary: "Get review by ID" })
    @ApiParam({ name: 'id', description: 'Review ID' })
    async findOne(@Param('id') id: string) {
        return this.reviewService.findOne(id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ValidateAuth()
    @ApiOperation({ summary: "Update review" })
    @ApiParam({ name: 'id', description: 'Review ID' })
    @ApiBody({ type: UpdateReviewDto })
    async update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto, @Req() req: any) {
        return this.reviewService.update(id, updateReviewDto, req.user.id);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @ValidateAuth()
    @ApiOperation({ summary: "Delete review" })
    @ApiParam({ name: 'id', description: 'Review ID' })
    async remove(@Param('id') id: string, @Req() req: any) {
        return this.reviewService.remove(id, req.user.id);
    }

    @Get('garage/:garageId/stats')
    @ApiOperation({ summary: "Get review statistics for garage" })
    @ApiParam({ name: 'garageId', description: 'Garage ID' })
    async getGarageStats(@Param('garageId') garageId: string) {
        return this.reviewService.getGarageStats(garageId);
    }
}
