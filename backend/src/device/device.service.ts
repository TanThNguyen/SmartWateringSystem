import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddDeviceDto, DeleteDevicesDto, FindAllDevicesDto, GetDevicesRequestDto, InfoDevicesDto } from './dto';

@Injectable()
export class DeviceService {
    constructor(
        private prismaService: PrismaService,
    ) { }

    async add(addDeviceDto: AddDeviceDto): Promise<string> {
        return "This is a test function for adding a device. Replace with actual implementation.";
    }

    async deleteMany(deleteDevicesDto: DeleteDevicesDto): Promise<string> {
        const { deviceIds } = deleteDevicesDto;

        await this.prismaService.device.deleteMany({
            where: { deviceId: { in: deviceIds } },
        });

        return 'Devices deleted successfully!';
    }

    async getAllDevices(query: GetDevicesRequestDto): Promise<FindAllDevicesDto> {
        const page = Number(query.page) || 1;
        const items_per_page = Number(query.items_per_page) || 5;
        const { order, search, status, location } = query;
        const skip = (page - 1) * items_per_page;

        const [devices, total] = await Promise.all([
            this.prismaService.device.findMany({
                where: {
                    ...(search && {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { location: { contains: search, mode: 'insensitive' } }
                        ],
                    }),
                    ...(status !== 'ALL' && { status }),
                    ...(location && { location: { contains: location, mode: 'insensitive' } }),
                },
                orderBy: {
                    lastUpdated: order === 'asc' ? 'asc' : 'desc',
                },
                take: items_per_page,
                skip: skip,
                select: {
                    deviceId: true,
                    name: true,
                    type: true,
                    location: true,
                    status: true,
                    lastUpdated: true,
                },
            }),
            this.prismaService.device.count({
                where: {
                    ...(search && {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { location: { contains: search, mode: 'insensitive' } }
                        ],
                    }),
                    ...(status !== 'ALL' && { status }),
                    ...(location && { location: { contains: location, mode: 'insensitive' } }),
                },
            }),
        ]);

        const lastPage = Math.ceil(total / items_per_page);
        const nextPage = page + 1 > lastPage ? null : page + 1;
        const prevPage = page - 1 < 1 ? null : page - 1;

        const formattedDevices: InfoDevicesDto[] = devices.map(device => ({
            deviceId: device.deviceId,
            name: device.name,
            type: device.type,
            location: device.location,
            status: device.status,
            updatedAt: device.lastUpdated,
        }));

        return {
            devices: formattedDevices,
            total,
            currentPage: page,
            nextPage,
            prevPage,
            lastPage
        };
    }



    // Hiện thực hiển thị và cấu hình thông tin chi tiết cho từng thiết bị
    // Tạm thời chưa thực hiện
    async getOneDevices(): Promise<String> {
        return "This is a test function for getting all devices. Replace with actual implementation.";
    }

    async edit(): Promise<string> {
        return "This is a test function for editing a device. Replace with actual implementation.";
    }
}
