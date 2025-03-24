import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    ConfigurationCreateDto,
    ConfigurationDeleteDto,
    ConfigurationFilterDto,
    ConfigurationQueryDto,
    ConfigurationUpdateDto
} from './dto';
import {
    ConfigurationPaginatedDto,
    ConfigurationListDto
} from './dto';

@Injectable()
export class ConfigurationService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: ConfigurationCreateDto): Promise<string> {
        try {
            await this.prisma.configuration.create({
                data: {
                    name: data.name,
                    value: data.value,
                    locationId: data.locationId,
                    deviceType: data.deviceType,
                },
            });
            return 'Tạo cấu hình thành công';
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi tạo cấu hình');
        }
    }

    async update(data: ConfigurationUpdateDto): Promise<string> {
        try {
            const existingConfig = await this.prisma.configuration.findUnique({
                where: { configId: data.configId },
            });

            if (!existingConfig) {
                throw new NotFoundException('Không tìm thấy cấu hình');
            }

            await this.prisma.configuration.update({
                where: { configId: data.configId },
                data: {
                    name: data.name,
                    value: data.value,
                    locationId: data.locationId,
                    deviceType: data.deviceType,
                },
            });
            return 'Cập nhật cấu hình thành công';
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi cập nhật cấu hình');
        }
    }

    async delete(data: ConfigurationDeleteDto): Promise<string> {
        try {
            const existingConfig = await this.prisma.configuration.findUnique({
                where: { configId: data.configId },
            });

            if (!existingConfig) {
                throw new NotFoundException('Không tìm thấy cấu hình');
            }

            await this.prisma.configuration.delete({
                where: { configId: data.configId },
            });
            return 'Xóa cấu hình thành công';
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi xóa cấu hình');
        }
    }

    async getAll(query: ConfigurationQueryDto): Promise<ConfigurationPaginatedDto> {
        try {
            const { page, items_per_page, search, deviceType } = query;
            const skip = (page - 1) * items_per_page;

            const where: any = {};
            if (search) {
                where.name = { contains: search, mode: 'insensitive' };
            }
            if (deviceType && deviceType !== 'ALL') {
                where.deviceType = deviceType;
            }

            const [configurations, total] = await this.prisma.$transaction([
                this.prisma.configuration.findMany({
                    where,
                    skip,
                    take: items_per_page,
                    orderBy: { lastUpdated: 'desc' },
                }),
                this.prisma.configuration.count({ where }),
            ]);

            const lastPage = Math.ceil(total / items_per_page);
            return {
                configurations,
                total,
                currentPage: page,
                nextPage: page < lastPage ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
                lastPage,
            };
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi lấy danh sách cấu hình');
        }
    }

    async getWithFilter(query: ConfigurationFilterDto): Promise<ConfigurationListDto> {
        try {
            const configurations = await this.prisma.configuration.findMany({
                where: {
                    locationId: query.locationId,
                    deviceType: query.deviceType,
                },
                orderBy: { lastUpdated: 'desc' },
            });
            return { configurations };
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi lấy danh sách cấu hình theo bộ lọc');
        }
    }
}