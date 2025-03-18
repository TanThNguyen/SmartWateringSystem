import { Body, Controller, Delete, Get, Post, Put, Query, SetMetadata, UseGuards } from '@nestjs/common';
import { DeviceService } from './device.service';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { AddDeviceDto, DeleteDevicesDto, FindAllDevicesDto, GetDevicesRequestDto } from './dto';

@Controller('device')
export class DeviceController {
    constructor(
        private readonly deviceService: DeviceService,
    ) { }

    // @Post('add')
    // @UseGuards(RoleGuard)
    // @SetMetadata('roles', ['ADMIN'])
    // add(@Body() addDeviceDto: AddDeviceDto): Promise<String> {
    //     return this.deviceService.add(addDeviceDto);
    // }

    // @Delete('delete')
    // @UseGuards(RoleGuard)
    // @SetMetadata('roles', ['ADMIN'])
    // delete(@Body() deleteDevicesDto: DeleteDevicesDto): Promise<String> {
    //     return this.deviceService.deleteMany(deleteDevicesDto);
    // }

    // @Get('all')
    // async getAllDevices(@Query() query: GetDevicesRequestDto): Promise<FindAllDevicesDto> {
    //     return await this.deviceService.getAllDevices(query);
    // }



    // Hiện thực hiển thị và cấu hình thông tin chi tiết cho từng thiết bị
    // Tạm thời chưa thực hiện
    @Get('one')
    async getOneDevices(): Promise<String> {
        return await this.deviceService.getOneDevices();
    }

    @Put('edit')
    edit(): Promise<String> {
        return this.deviceService.edit();
    }
}
