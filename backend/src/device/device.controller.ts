import { Body, Controller, Delete, Get, Post, Put, Query, SetMetadata, UseGuards } from '@nestjs/common';
import { DeviceService } from './device.service';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { AddDeviceDto, DeleteDevicesDto, DeviceIdDto, EditDeviceDto, FindAllDevicesDto, GetDevicesRequestDto } from './dto';
import { query } from 'express';

@Controller('device')
export class DeviceController {
    constructor(
        private readonly deviceService: DeviceService,
    ) { }

    @Post('add')
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    add(@Body() addDeviceDto: AddDeviceDto): Promise<String> {
        return this.deviceService.add(addDeviceDto);
    }

    @Delete('delete')
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    delete(@Body() deleteDevicesDto: DeleteDevicesDto): Promise<String> {
        return this.deviceService.deleteMany(deleteDevicesDto);
    }

    @Get('all')
    async getAllDevices(@Query() query: GetDevicesRequestDto): Promise<FindAllDevicesDto> {
        return await this.deviceService.getAllDevices(query);
    }

    @Put('toggle')
    async toggleStatus(@Body() body: DeviceIdDto): Promise<String> {
        return await this.deviceService.toggleStatus(body);
    }



    @Get('one')
    async getOneDevice(@Query() query: DeviceIdDto): Promise<any> {
        return await this.deviceService.getOneDevice(query.deviceId);
    }
    
    @Put('edit')
    async editDevice(@Body() body: EditDeviceDto): Promise<string> {
        return await this.deviceService.editDevice(body);
    }
    
}
