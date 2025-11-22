import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  GetUser,
  ValidateAuth,
  ValidateGarageOwner,
} from 'src/common/jwt/jwt.decorator';
import { FileType, MulterService } from 'src/lib/multer/multer.service';
import { CreateGarageDto } from '../dto/create-garage.dto';
import { QueryGarageDto } from '../dto/query-garage.dto';
import { UpdateGarageDto } from '../dto/update-garage.dto';
import { GarageService } from '../service/garage.service';

@ApiTags('Garages')
@Controller('garages')
export class GarageController {
  constructor(private readonly garageService: GarageService) {}

  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateGarageOwner()
  @Post()
  @ApiOperation({ summary: 'Create a new garage' })
  @ApiBody({ type: CreateGarageDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'coverPhoto', maxCount: 1 },
        { name: 'profileImage', maxCount: 1 },
      ],
      new MulterService().createMulterOptions(
        './Uploads',
        'content',
        FileType.IMAGE,
      ),
    ),
  )
  @ApiResponse({
    status: 201,
    description: 'The garage has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Garage name already exists.' })
  async create(
    @GetUser('userId') userId: string,
    @Body() createGarageDto: CreateGarageDto,
    @UploadedFiles()
    files: {
      coverPhoto?: Express.Multer.File[];
      profileImage?: Express.Multer.File[];
    } = {},
  ) {
    // console.log('POST /garages hit', { createGarageDto, files });
    console.log('userId', userId);
    return this.garageService.create(userId, createGarageDto, {
      coverPhoto: files.coverPhoto?.[0],
      profileImage: files.profileImage?.[0],
    });
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all garages with search and pagination' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, city, emirate, or address',
  })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({
    name: 'emirate',
    required: false,
    description: 'Filter by emirate',
  })
  @ApiQuery({
    name: 'serviceName',
    required: false,
    description: 'Filter by service type name',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'List of all garages with related data.',
  })
  findAll(@Query() query: QueryGarageDto) {
    return this.garageService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a garage by ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the garage',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'The garage details.' })
  @ApiResponse({ status: 404, description: 'Garage not found.' })
  findOne(@Param('id') id: string) {
    return this.garageService.findOne(id);
  }

  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateGarageOwner()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a garage by ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the garage',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateGarageDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'coverPhoto', maxCount: 1 },
        { name: 'profileImage', maxCount: 1 },
      ],
      new MulterService().createMulterOptions(
        './Uploads',
        'content',
        FileType.IMAGE,
      ),
    ),
  )
  @ApiResponse({ status: 200, description: 'The garage has been updated.' })
  @ApiResponse({ status: 404, description: 'Garage not found.' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to update this garage.',
  })
  @ApiResponse({ status: 409, description: 'Garage name already exists.' })
  async update(
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updateGarageDto: UpdateGarageDto,
    @UploadedFiles()
    files: {
      coverPhoto?: Express.Multer.File[];
      profileImage?: Express.Multer.File[];
    } = {},
  ) {
    console.log('userId', userId);
    return this.garageService.update(userId, id, updateGarageDto, {
      coverPhoto: files.coverPhoto?.[0],
      profileImage: files.profileImage?.[0],
    });
  }

  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateGarageOwner()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a garage by ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the garage',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'The garage has been deleted.' })
  @ApiResponse({ status: 404, description: 'Garage not found.' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete this garage.',
  })
  remove(@GetUser('userId') userId: string, @Param('id') id: string) {
    return this.garageService.remove(userId, id);
  }

  // -----------grage with long -----
  // @ValidateAuth()
  // @ApiBearerAuth()
  // @ValidateGarageOwner()
  // @Post('location')
  // @ApiOperation({ summary: ' location with long Create a new garage' })
  // @ApiBody({ type: CreateGarageDto })
  // @ApiConsumes('multipart/form-data')
  // @UseInterceptors(
  //   FileFieldsInterceptor(
  //     [
  //       { name: 'coverPhoto', maxCount: 1 },
  //       { name: 'profileImage', maxCount: 1 },
  //     ],
  //     new MulterService().createMulterOptions(
  //       './Uploads',
  //       'content',
  //       FileType.IMAGE,
  //     ),
  //   ),
  // )
  // @ApiResponse({
  //   status: 201,
  //   description: 'The garage has been successfully created.',
  // })
  // @ApiResponse({ status: 400, description: 'Invalid input data.' })
  // @ApiResponse({ status: 409, description: 'Garage name already exists.' })
  // async locationcreate(
  //   @GetUser('userId') userId: string,
  //   @Body() createGarageDto: CreateGarageDto,
  //   @UploadedFiles()
  //   files: {
  //     coverPhoto?: Express.Multer.File[];
  //     profileImage?: Express.Multer.File[];
  //   } = {},
  // ) {
  //   // console.log('POST /garages hit', { createGarageDto, files });
  //   console.log('userId', userId);
  //   return this.garageService.create(userId, createGarageDto, {
  //     coverPhoto: files.coverPhoto?.[0],
  //     profileImage: files.profileImage?.[0],
  //   });
  // }
}
