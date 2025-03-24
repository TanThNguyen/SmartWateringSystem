import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, SetMetadata, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto, UpdateLocationDto, GetLocationsRequestDto, FindAllLocationsDto, DeleteLocationDto } from './dto/location.dto';
import { RoleGuard } from 'src/auth/guard/role.guard';

@Controller('location')
export class LocationController {
    constructor(private readonly locationService: LocationService) { }

    @Get('all')
    getAll(@Query() query: GetLocationsRequestDto):Promise<FindAllLocationsDto> {
        return this.locationService.getAll(query);
    }

    @Post('add')
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    add(@Body() createLocationDto: CreateLocationDto): Promise<String> {
        return this.locationService.add(createLocationDto);
    }

    @Put('edit')
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    edit(@Body() updateLocationDto: UpdateLocationDto): Promise<String> {
        return this.locationService.edit(updateLocationDto);
    }

    @Delete('delete')
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    delete(@Body() deleteLocationDto: DeleteLocationDto): Promise<String> {
        return this.locationService.delete(deleteLocationDto);
    }
}
