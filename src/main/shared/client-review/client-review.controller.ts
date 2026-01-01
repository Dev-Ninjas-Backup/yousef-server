import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser, ValidateAdmin, ValidateUser } from 'src/common/jwt/jwt.decorator';
import { ClientReviewService } from './client-review.service';
import { CreateClientReviewDto } from './dto/create-client-review.dto';
import { UpdateClientReviewDto } from './dto/update-client-review.dto';

@ApiTags('What Our beloved Clients Says')
@Controller('client-review')
export class ClientReviewController {
  constructor(private readonly clientReviewService: ClientReviewService) { }

  @ApiOperation({ summary: 'Create a new client review' })
  @ApiBearerAuth()
  @ValidateUser()
  @Post()
  createClientReview(@Body() dto: CreateClientReviewDto,
    @GetUser('userId') userId: string) {
    return this.clientReviewService.createClientReview(dto, userId);
  }

  @ApiOperation({ summary: 'Get all client reviews' })
  @Get()
  findAll() {
    return this.clientReviewService.findAll();
  }

  @ApiOperation({ summary: 'Get a single client review by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientReviewService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a client review' })
  @ApiBearerAuth()
  @ValidateUser()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientReviewDto: UpdateClientReviewDto, @GetUser('userId') userId: string) {
    return this.clientReviewService.update(id, updateClientReviewDto, userId);
  }

  @ApiOperation({ summary: 'Delete a client review (only the user can delete their own review)' })
  @ApiBearerAuth()
  @ValidateUser()
  @Delete(':id')
  removeSpecific(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.clientReviewService.removeSpecific(id, userId);
  }
  // --------DELETE ALL REVIEW ADMIN-----------

  @ApiOperation({ summary: 'Delete all client reviews (Admin only)' })
  @ApiBearerAuth()
  @ValidateAdmin()
  @Delete(':id/admin')
  removeReviewAdmin(@Param('id') id: string) {
    return this.clientReviewService.removeReviewAdmin(id);
  }
}
