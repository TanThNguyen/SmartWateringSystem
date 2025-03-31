import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLocationDto, UpdateLocationDto, GetLocationsRequestDto, FindAllLocationsDto, DeleteLocationDto } from './dto/location.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LOG_EVENT, LogEventPayload } from 'src/log/dto';
import { Severity } from '@prisma/client';

@Injectable()
export class LocationService {
    constructor(
        private readonly prisma: PrismaService,
        private eventEmitter: EventEmitter2,
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

            // --- BỔ SUNG LOG ---
            const logPayloadSuccess: LogEventPayload = {
                eventType: Severity.INFO,
                description: `Địa điểm mới '${location.name}' (ID: ${location.locationId}) đã được tạo.`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
            // --- KẾT THÚC BỔ SUNG ---

            return `Đã tạo địa điểm với ID: ${location.locationId}`;
        } catch (error) {

            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                eventType: Severity.ERROR,
                description: `Lỗi khi tạo địa điểm với tên '${createLocationDto.name}': ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            throw new InternalServerErrorException('Không thể tạo địa điểm');
        }
    }

    async edit(updateLocationDto: UpdateLocationDto): Promise<string> {
        const { locationId, name } = updateLocationDto;
        let oldName: string = '';
        try {
            const currentLocation = await this.prisma.location.findUnique({
                where: { locationId },
                select: { name: true }
            });
            if (!currentLocation) {
                throw new NotFoundException(`Không tìm thấy địa điểm với ID: ${locationId}`);
            }
            oldName = currentLocation.name;

            // Thực hiện cập nhật
            await this.prisma.location.update({
                where: { locationId },
                data: { name, updatedAt: new Date() }, // Cập nhật cả updatedAt nếu cần
            });

            // --- BỔ SUNG LOG ---
            const logPayloadSuccess: LogEventPayload = {
                eventType: Severity.INFO,
                description: `Địa điểm '${oldName}' (ID: ${locationId}) đã được cập nhật thành '${name}'.`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
            // --- KẾT THÚC BỔ SUNG ---

            return `Đã cập nhật địa điểm ${locationId} thành công`;
        } catch (error) {

            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                eventType: Severity.ERROR,
                description: `Lỗi khi cập nhật địa điểm ID ${locationId} (tên cũ: '${oldName}') thành '${name}': ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            if (error.code === 'P2025') throw new NotFoundException('Không tìm thấy địa điểm');
            throw new InternalServerErrorException('Không thể cập nhật địa điểm');
        }
    }

    async delete(deleteLocationDto: DeleteLocationDto): Promise<string> {
        const { locationId } = deleteLocationDto;
        let locationName: string = '';
        try {
            const locationToDelete = await this.prisma.location.findUnique({
                where: { locationId },
                select: { name: true }
            });
            if (!locationToDelete) {
                throw new NotFoundException(`Không tìm thấy địa điểm với ID: ${locationId}`);
            }
            locationName = locationToDelete.name;

            await this.prisma.location.delete({
                where: { locationId },
            });

            // --- BỔ SUNG LOG ---
            const logPayloadSuccess: LogEventPayload = {
                eventType: Severity.INFO,
                description: `Địa điểm '${locationName}' (ID: ${locationId}) đã được xóa thành công.`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
            // --- KẾT THÚC BỔ SUNG ---

            return `Đã xóa địa điểm ${locationId} thành công`;
        } catch (error) {
            
            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                eventType: Severity.ERROR,
                description: `Lỗi khi xóa địa điểm ID ${locationId} (tên: '${locationName}'): ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            if (error.code === 'P2025') throw new NotFoundException('Không tìm thấy địa điểm');
            throw new InternalServerErrorException('Không thể xóa địa điểm');
        }
    }
}
