import { Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { DeviceService } from './device.service';

@Controller('device')
export class DeviceController {
    constructor(
        private readonly deviceService: DeviceService,
    ) { }

    @Post('add')
    add(): Promise<String> {
        return this.deviceService.add();
    }

    @Delete('delete')
    delete(): Promise<String> {
        return this.deviceService.deleteMany();
    }

    @Get('all')
    async getAllDevices(): Promise<String> {
        return await this.deviceService.getAllDevices();
    }


    
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
