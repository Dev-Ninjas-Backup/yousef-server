import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ValidateAdmin, ValidateAuth } from 'src/common/jwt/jwt.decorator';
import { CreatePartsCategoryDto } from './dto/create-parts-category.dto';
import { UpdatePartsCategoryDto } from './dto/update-parts-category.dto';
import { PartsCategoryService } from './parts-category.service';

@ApiTags('Parts Category')
@Controller('parts-category')
export class PartsCategoryController {
    constructor(private readonly partsService: PartsCategoryService) { }

    @ApiBearerAuth()
    @ValidateAuth()
    @ValidateAdmin()
    @Post()
    @ApiOperation({ summary: 'Create a parts category' })
    async create(@Body() createPartsCategoryDto: CreatePartsCategoryDto) {
        return this.partsService.create(createPartsCategoryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all parts categories' })
    async findAll() {
        return this.partsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a parts category by ID' })
    async findOne(@Param('id') id: string) {
        return this.partsService.findOne(id);
    }

    @ApiBearerAuth()
    @ValidateAuth()
    @ValidateAdmin()
    @Patch(':id')
    @ApiOperation({ summary: 'Update a parts category' })
    async update(
        @Param('id') id: string,
        @Body() updatePartsCategoryDto: UpdatePartsCategoryDto
    ) {
        return this.partsService.update(id, updatePartsCategoryDto);
    }

    @ApiBearerAuth()
    @ValidateAuth()
    @ValidateAdmin()
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a parts category' })
    async remove(@Param('id') id: string) {
        return this.partsService.remove(id);
    }
}
