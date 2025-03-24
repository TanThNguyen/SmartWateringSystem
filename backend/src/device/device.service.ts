import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddDeviceDto, DeleteDevicesDto, FindAllDevicesDto, GetDevicesRequestDto, InfoDevicesDto, DeviceIdDto, EditDeviceDto } from './dto';
import { DeviceStatus, DeviceType } from '@prisma/client';

@Injectable()
export class DeviceService {
    constructor(
        private prismaService: PrismaService,
    ) { }

    async add(addDeviceDto: AddDeviceDto): Promise<string> {
        try {
            const { name, type, locationName, status, thresholdId, tempMinId, tempMaxId, humidityThresholdId, speed } = addDeviceDto;

            // Tìm location theo tên
            const location = await this.prismaService.location.findUnique({
                where: { name: locationName },
                select: { locationId: true }
            });

            if (!location) throw new Error('Không tìm thấy vị trí!');

            // Tạo thiết bị trong bảng Device
            const device = await this.prismaService.device.create({
                data: { name, type, locationId: location.locationId, status }
            });

            // Xử lý tùy theo loại thiết bị
            switch (type) {
                case DeviceType.PUMP:
                    await this.prismaService.pump.create({
                        data: { pumpId: device.deviceId }
                    });
                    break;
                case DeviceType.MOISTURE_SENSOR:
                    if (!thresholdId) throw new Error('Thiếu giá trị ngưỡng độ ẩm!');
                    await this.prismaService.moistureSensor.create({
                        data: { sensorId: device.deviceId, thresholdId }
                    });
                    break;
                case DeviceType.DHT20_SENSOR:
                    if (!tempMinId || !tempMaxId || !humidityThresholdId) {
                        throw new Error('Thiếu thông tin ngưỡng nhiệt độ hoặc độ ẩm!');
                    }
                    await this.prismaService.dHT20Sensor.create({
                        data: { sensorId: device.deviceId, tempMinId, tempMaxId, humidityThresholdId }
                    });
                    break;
                case DeviceType.FAN:
                    if (!speed) throw new Error('Thiếu giá trị tốc độ quạt!');
                    await this.prismaService.fan.create({
                        data: { fanId: device.deviceId, speed: parseFloat(speed) }
                    });
                    break;
                case DeviceType.LCD:
                case DeviceType.LED:
                    // Không cần thao tác thêm, chỉ lưu vào bảng Device
                    break;
                default:
                    throw new Error('Loại thiết bị không hợp lệ!');
            }

            return 'Thêm thiết bị thành công!';
        } catch (error) {
            return `Lỗi: ${error.message}`;
        }
    }


    async deleteMany(deleteDevicesDto: DeleteDevicesDto): Promise<string> {
        try {
            const { deviceIds } = deleteDevicesDto;

            if (!deviceIds || deviceIds.length === 0) {
                throw new Error('Danh sách thiết bị cần xóa không hợp lệ!');
            }

            await this.prismaService.$transaction(async (prisma) => {
                await prisma.device.updateMany({
                    where: { deviceId: { in: deviceIds } },
                    data: { status: DeviceStatus.INACTIVE }
                });
            });

            return 'Đã vô hiệu hóa các thiết bị thành công!';
        } catch (error) {
            return `Lỗi: ${error.message}`;
        }
    }


    async getAllDevices(query: GetDevicesRequestDto): Promise<FindAllDevicesDto> {
        try {
            const page = query.page || 1;
            const itemsPerPage = query.items_per_page || 5;
            const { order, search, status, locationName } = query;
            const skip = (page - 1) * itemsPerPage;

            // Xây dựng điều kiện tìm kiếm
            const whereCondition: any = {
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { location: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                }),
                ...(status !== 'ALL' && { status }),
                ...(locationName && { location: { name: { contains: locationName, mode: 'insensitive' } } })
            };

            // Thực hiện truy vấn song song để tối ưu hiệu suất
            const [devices, total] = await Promise.all([
                this.prismaService.device.findMany({
                    where: whereCondition,
                    orderBy: { updatedAt: order === 'asc' ? 'asc' : 'desc' },
                    take: itemsPerPage,
                    skip: skip,
                    include: { location: true }
                }),
                this.prismaService.device.count({ where: whereCondition })
            ]);

            // Xử lý phân trang
            const lastPage = Math.ceil(total / itemsPerPage);
            const nextPage = page + 1 > lastPage ? null : page + 1;
            const prevPage = page - 1 < 1 ? null : page - 1;

            // Định dạng dữ liệu trả về
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
            throw new Error(`Lỗi khi lấy danh sách thiết bị: ${error.message}`);
        }
    }

    async toggleStatus(body: DeviceIdDto): Promise<string> {
        try {
            const { deviceId } = body;

            // Tìm thiết bị theo ID
            const device = await this.prismaService.device.findUnique({
                where: { deviceId }
            });

            if (!device) {
                throw new Error('Không tìm thấy thiết bị.');
            }

            // Danh sách các thiết bị có thể toggle trực tiếp
            const allowedTypes = ['PUMP', 'FAN', 'LCD', 'LED'];

            if (!allowedTypes.includes(device.type) && device.status === 'ACTIVE') {
                throw new Error(
                    'Hãy ngắt kết nối thiết bị, trạng thái sẽ tự động cập nhật.'
                );
            }

            // Cập nhật trạng thái thiết bị
            const newStatus = device.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await this.prismaService.device.update({
                where: { deviceId },
                data: { status: newStatus }
            });

            return `Thiết bị đã chuyển sang trạng thái ${newStatus === 'ACTIVE' ? 'hoạt động' : 'không hoạt động'}.`;
        } catch (error) {
            throw new Error(`Lỗi khi thay đổi trạng thái thiết bị: ${error.message}`);
        }
    }



    // Hiện thực hiển thị và cấu hình thông tin chi tiết cho từng thiết bị
    // Tạm thời chưa thực hiện
    async getOneDevice(deviceId: string): Promise<any> {
        try {
            const device = await this.prismaService.device.findUnique({
                where: { deviceId },
                include: {
                    location: true,
                    pump: true,
                    fan: true,
                    moistureSensor: true,
                    dht20Sensor: true,
                }
            });

            if (!device) {
                throw new Error('Không tìm thấy thiết bị.');
            }

            return {
                deviceId: device.deviceId,
                name: device.name,
                type: device.type,
                status: device.status,
                location: device.location?.name || 'Unknown',
                ...(device.pump && { pump: device.pump }),
                ...(device.fan && { fan: device.fan }),
                ...(device.moistureSensor && { moistureSensor: device.moistureSensor }),
                ...(device.dht20Sensor && { dht20Sensor: device.dht20Sensor }),
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy thông tin thiết bị: ${error.message}`);
        }
    }

    async editDevice(editDeviceDto: EditDeviceDto): Promise<string> {
        try {
            const { deviceId, name, status, locationId, pump, fan, moistureSensor, dht20Sensor } = editDeviceDto;

            return await this.prismaService.$transaction(async (prisma) => {
                // Tìm thiết bị
                const device = await prisma.device.findUnique({
                    where: { deviceId },
                    include: {
                        pump: true,
                        fan: true,
                        moistureSensor: true,
                        dht20Sensor: true,
                    },
                });

                if (!device) {
                    throw new NotFoundException(`Không tìm thấy thiết bị với ID: ${deviceId}`);
                }

                // Cập nhật thuộc tính chung
                const updateData: any = {};
                if (name) updateData.name = name;
                if (status) updateData.status = status;
                if (locationId) updateData.locationId = locationId;

                // Cập nhật từng loại thiết bị nếu có
                if (pump && device.type === DeviceType.PUMP) {
                    await prisma.pump.update({
                        where: { pumpId: deviceId },
                        data: pump,
                    });
                }
                if (fan && device.type === DeviceType.FAN) {
                    await prisma.fan.update({
                        where: { fanId: deviceId },
                        data: fan,
                    });
                }
                if (moistureSensor && device.type === DeviceType.MOISTURE_SENSOR) {
                    await prisma.moistureSensor.update({
                        where: { sensorId: deviceId },
                        data: moistureSensor,
                    });
                }
                if (dht20Sensor && device.type === DeviceType.DHT20_SENSOR) {
                    await prisma.dHT20Sensor.update({
                        where: { sensorId: deviceId },
                        data: dht20Sensor,
                    });
                }

                // Cập nhật thiết bị
                await prisma.device.update({
                    where: { deviceId },
                    data: updateData,
                });

                return `Cập nhật thiết bị thành công!`;
            });
        } catch (error) {
            console.error(`Lỗi khi cập nhật thiết bị:`, error);
            return `Đã xảy ra lỗi khi cập nhật thiết bị. Vui lòng thử lại!`;
        }
    }


}
