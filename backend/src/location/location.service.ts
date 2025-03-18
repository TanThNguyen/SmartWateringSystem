import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLocationDto, UpdateLocationDto, GetLocationsRequestDto, FindAllLocationsDto, DeleteLocationDto } from './dto/location.dto';

@Injectable()
export class LocationService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async getAll(query: GetLocationsRequestDto): Promise<FindAllLocationsDto> {
        try {
            const locations = await this.prisma.location.findMany({
                where: query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {},
                orderBy: query.order ? { name: query.order === 'asc' ? 'asc' : 'desc' } : undefined,
            });

            return { locations };
        } catch (error) {
            throw new InternalServerErrorException('Không thể lấy danh sách địa điểm');
        }
    }

    async add(createLocationDto: CreateLocationDto): Promise<string> {
        try {
            const location = await this.prisma.location.create({
                data: { name: createLocationDto.name },
            });
            return `Đã tạo địa điểm với ID: ${location.locationId}`;
        } catch (error) {
            throw new InternalServerErrorException('Không thể tạo địa điểm');
        }
    }

    async edit(updateLocationDto: UpdateLocationDto): Promise<string> {
        const { locationId, name } = updateLocationDto;
        try {
            const location = await this.prisma.location.update({
                where: { locationId },
                data: { name, updatedAt: new Date() },
            });

            if (!location) throw new NotFoundException('Không tìm thấy địa điểm');
            return `Đã cập nhật địa điểm ${locationId} thành công`;
        } catch (error) {
            if (error.code === 'P2025') throw new NotFoundException('Không tìm thấy địa điểm');
            throw new InternalServerErrorException('Không thể cập nhật địa điểm');
        }
    }

    async delete(deleteLocationDto: DeleteLocationDto): Promise<string> {
        const { locationId } = deleteLocationDto;
        try {
            await this.prisma.location.delete({
                where: { locationId },
            });
            return `Đã xóa địa điểm ${locationId} thành công`;
        } catch (error) {
            if (error.code === 'P2025') throw new NotFoundException('Không tìm thấy địa điểm');
            throw new InternalServerErrorException('Không thể xóa địa điểm');
        }
    }
}
