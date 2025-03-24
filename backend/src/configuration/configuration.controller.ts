import { Body, Controller, Delete, Get, Post, Put, Query, SetMetadata, UseGuards } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { ConfigurationCreateDto, ConfigurationDeleteDto, ConfigurationFilterDto, ConfigurationListDto, ConfigurationPaginatedDto, ConfigurationQueryDto, ConfigurationUpdateDto } from './dto';
import { query } from 'express';

@Controller('configurations')
export class ConfigurationController {
    constructor(private readonly configurationService: ConfigurationService) { }
    @Post()
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    create(@Body() configuration: ConfigurationCreateDto): Promise<String> {
        return this.configurationService.create(configuration);
    }

    @Put()
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    edit(@Body() configuration: ConfigurationUpdateDto): Promise<String> {
        return this.configurationService.update(configuration);
    }

    @Delete()
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    delete(@Body() configurationId: ConfigurationDeleteDto): Promise<String> {
        return this.configurationService.delete(configurationId);
    }

    @Get()
    async getAll(@Query() query: ConfigurationQueryDto): Promise<ConfigurationPaginatedDto> {
        return await this.configurationService.getAll(query);
    }

    @Get('filter')
    getById(@Query() query: ConfigurationFilterDto): Promise<ConfigurationListDto> {
        return this.configurationService.getWithFilter(query);
    }
}
