import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddDeviceDto, DeleteDevicesDto, FindAllDevicesDto, GetDevicesRequestDto, InfoDevicesDto, DeviceIdDto, EditDeviceDto } from './dto';
import { DeviceStatus, DeviceType, Prisma } from '@prisma/client';
import { DeviceFactory } from './factories/device.factory';


@Injectable()
export class DeviceService {
    constructor(
        private prismaService: PrismaService,
        private deviceFactory: DeviceFactory, // Inject Factory
    ) { }

    async add(addDeviceDto: AddDeviceDto): Promise<string> {
        const { name, type, locationName, status } = addDeviceDto;

        try {
            const location = await this.prismaService.location.findUnique({
                where: { name: locationName },
                select: { locationId: true },
            });
            if (!location) {
                throw new NotFoundException(`Không tìm thấy vị trí với tên: ${locationName}`);
            }

            const handler = this.deviceFactory.getHandler(type);
            handler.validateAddData?.(addDeviceDto);

            await this.prismaService.$transaction(async (prisma) => {
                const device = await prisma.device.create({
                    data: {
                        name,
                        type,
                        locationId: location.locationId,
                        status,
                    },
                });
                await handler.createSpecifics(prisma, device.deviceId, addDeviceDto);
            });

            return 'Thêm thiết bị thành công!';

        } catch (error) {

            if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error;
            }

            console.error(`Lỗi khi thêm thiết bị:`, error);
            throw new InternalServerErrorException(`Đã xảy ra lỗi khi thêm thiết bị: ${error.message}`);
        }
    }

    async deleteMany(deleteDevicesDto: DeleteDevicesDto): Promise<string> {
        const { deviceIds } = deleteDevicesDto;
        if (!deviceIds || deviceIds.length === 0) {
            throw new BadRequestException('Danh sách thiết bị cần xóa không hợp lệ!');
        }
        try {
            const count = await this.prismaService.device.updateMany({
                where: { deviceId: { in: deviceIds } },
                data: { status: DeviceStatus.INACTIVE },
            });
            return `Đã vô hiệu hóa ${count.count} thiết bị thành công!`;
        } catch (error) {
            console.error(`Lỗi khi vô hiệu hóa thiết bị:`, error);
            throw new InternalServerErrorException(`Đã xảy ra lỗi khi vô hiệu hóa thiết bị: ${error.message}`);
        }
    }

    async getAllDevices(query: GetDevicesRequestDto): Promise<FindAllDevicesDto> {
        try {
            const page = query.page || 1;
            const itemsPerPage = query.items_per_page || 5;
            const { order, search, status, locationName } = query;
            const skip = (page - 1) * itemsPerPage;

            const whereCondition: Prisma.DeviceWhereInput = {
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { location: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                }),
                ...(status !== 'ALL' && { status }),
                ...(locationName && { location: { name: { contains: locationName, mode: 'insensitive' } } })
            };

            const [devices, total] = await this.prismaService.$transaction([
                this.prismaService.device.findMany({
                    where: whereCondition,
                    orderBy: { updatedAt: order === 'asc' ? 'asc' : 'desc' },
                    take: itemsPerPage,
                    skip: skip,
                    include: { location: { select: { name: true } } } // Chỉ lấy tên location
                }),
                this.prismaService.device.count({ where: whereCondition })
            ]);

            const lastPage = Math.ceil(total / itemsPerPage);
            const nextPage = page + 1 > lastPage ? null : page + 1;
            const prevPage = page - 1 < 1 ? null : page - 1;

            const formattedDevices: InfoDevicesDto[] = devices.map(device => ({
                deviceId: device.deviceId,
                name: device.name,
                type: device.type,
                locationName: device.location?.name || 'Không xác định',
                status: device.status,
                updatedAt: device.updatedAt
            }));

            return {
                devices: formattedDevices,
                total,
                currentPage: page,
                nextPage,
                prevPage,
                lastPage
            };
        } catch (error) {
            console.error(`Lỗi khi lấy danh sách thiết bị:`, error);
            throw new InternalServerErrorException(`Lỗi khi lấy danh sách thiết bị: ${error.message}`);
        }
    }

    async toggleStatus(body: DeviceIdDto): Promise<string> {
        const { deviceId } = body;
        try {
            // Sử dụng transaction để đảm bảo tính nhất quán nếu handler có thao tác phức tạp
            const newStatus = await this.prismaService.$transaction(async (prisma) => {
                // 1. Lấy thông tin thiết bị cần thiết
                const device = await prisma.device.findUnique({
                    where: { deviceId },
                    select: { deviceId: true, status: true, type: true }, // Lấy các trường handler cần
                });

                if (!device) {
                    throw new NotFoundException('Không tìm thấy thiết bị.');
                }

                const handler = this.deviceFactory.getHandler(device.type);

                return await handler.toggleStatus(prisma, device);
            });

            return `Thiết bị đã chuyển sang trạng thái ${newStatus}.`;

        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error;
            }
            console.error(`Lỗi khi thay đổi trạng thái thiết bị ${deviceId}:`, error);
            throw new InternalServerErrorException(`Lỗi khi thay đổi trạng thái thiết bị: ${error.message}`);
        }
    }

    async getOneDevice(deviceId: string): Promise<any> {
        try {
            // 1. Lấy thông tin device cơ bản
            const device = await this.prismaService.device.findUnique({
                where: { deviceId },
                include: {
                    location: { select: { name: true } },
                },
            });

            if (!device) {
                throw new NotFoundException(`Không tìm thấy thiết bị với ID: ${deviceId}`);
            }

            // 2. Lấy handler và thông tin chi tiết đặc thù
            const handler = this.deviceFactory.getHandler(device.type);
            const specifics = await handler.getSpecifics(this.prismaService, deviceId);

            // 3. Kết hợp thông tin
            const result = {
                deviceId: device.deviceId,
                name: device.name,
                type: device.type,
                status: device.status,
                locationName: device.location?.name || 'Không xác định',
                createdAt: device.createdAt,
                updatedAt: device.updatedAt,
                ...(specifics && { [device.type.toLowerCase()]: specifics }),
            };

            if (result[device.type.toLowerCase()]) {
                delete result[device.type.toLowerCase()][`${device.type.toLowerCase()}Id`];
                if (result[device.type.toLowerCase()].sensorId) delete result[device.type.toLowerCase()].sensorId;
            }


            return result;

        } catch (error) {
            if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
                throw error;
            }
            console.error(`Lỗi khi lấy thông tin thiết bị ${deviceId}:`, error);
            throw new InternalServerErrorException(`Lỗi khi lấy thông tin thiết bị: ${error.message}`);
        }
    }

    async editDevice(editDeviceDto: EditDeviceDto): Promise<string> {
        const { deviceId, name, status, locationId } = editDeviceDto;
        try {
            return await this.prismaService.$transaction(async (prisma) => {
                const device = await prisma.device.findUnique({
                    where: { deviceId },
                    select: { type: true, status: true },
                });

                if (!device) {
                    throw new NotFoundException(`Không tìm thấy thiết bị với ID: ${deviceId}`);
                }

                const handler = this.deviceFactory.getHandler(device.type);
                const deviceUpdateData: Prisma.DeviceUpdateInput = {};

                if (name !== undefined) deviceUpdateData.name = name;
                if (locationId !== undefined) {
                    const locationExists = await prisma.location.findUnique({ where: { locationId } });
                    if (!locationExists) throw new BadRequestException(`Location với ID ${locationId} không tồn tại.`);
                    deviceUpdateData.location = { connect: { locationId } };
                }

                if (status !== undefined && status !== device.status) {
                    await handler.toggleStatus(prisma, { deviceId, status: device.status, type: device.type });
                }

                if (Object.keys(deviceUpdateData).length > 0) {
                    await prisma.device.update({
                        where: { deviceId },
                        data: deviceUpdateData,
                    });
                }

                await handler.updateSpecifics(prisma, deviceId, editDeviceDto);

                return `Cập nhật thiết bị ${deviceId} thành công!`;
            });
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error;
            }
            console.error(`Lỗi khi cập nhật thiết bị ${deviceId}:`, error);
            throw new InternalServerErrorException(`Đã xảy ra lỗi khi cập nhật thiết bị: ${error.message}`);
        }
    }

}