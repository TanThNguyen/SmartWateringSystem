import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, FindByEmailDto, DeleteUsersDto, UpdateUserDto, FindAllUsersDto, InfoUsersDto, GetUsersRequestDto } from './dto';
import { Role, Severity } from '@prisma/client';
import { handlerHashPassword } from 'src/helper/util';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LOG_EVENT, LogEventPayload } from 'src/log/dto';
import { MailerService } from '@nestjs-modules/mailer';
import dayjs from 'dayjs';

@Injectable()
export class UserService {
    constructor(
        private prismaService: PrismaService,
        private eventEmitter: EventEmitter2,
        private mailerService: MailerService,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<string> {
        const { name, email, locationId, phone, role, password } = createUserDto;
        console.log(name, email, locationId, phone, role, password);
        try {
            const isExist = await this.prismaService.user.findUnique({
                where: { email },
            });

            if (isExist) {
                throw new BadRequestException(`Email: ${email} đã tồn tại!`);
            }

            const locationExist = await this.prismaService.location.findUnique({
                where: { locationId: locationId },
            });

            if (!locationExist) {
                throw new BadRequestException(`Location ID: ${locationId} không hợp lệ!`);
            }

            const passwordHash = await handlerHashPassword(password);

            if (!passwordHash) {
                throw new InternalServerErrorException("Không thể tạo hash cho mật khẩu!");
            }

            const user = await this.prismaService.user.create({
                data: {
                    name,
                    email,
                    phone,
                    locationId,
                    passwordHash,
                    role,
                },
            });

            // this.mailerService
            //     .sendMail({
            //         to: user.email,
            //         subject: 'Activate your account ✔',
            //         template: 'active',
            //         context: {
            //             name,
            //             password,
            //         },
            //     })
            //     .catch((error) => {
            //         console.error('Gửi email thất bại:', error.message);
            //     });

            // --- BỔ SUNG LOG ---
            const logPayloadSuccess: LogEventPayload = {
                userId: user.userId,
                eventType: Severity.INFO,
                description: `Người dùng mới '${user.name}' (Email: ${user.email}) đã được tạo.`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
            // --- KẾT THÚC BỔ SUNG ---

            return user.email;
        } catch (error) {

            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                eventType: Severity.ERROR,
                description: `Lỗi khi tạo người dùng với email ${createUserDto.email}: ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            console.error('Lỗi trong quá trình tạo người dùng:', error);
            if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error;
            }
            throw new InternalServerErrorException('Lỗi không xác định khi tạo người dùng!');
        }
    }

    async update(updateUserDto: UpdateUserDto): Promise<string> {
        const { userId, name, email, locationId, phone, role, password } = updateUserDto;
        let userBeforeUpdate: { name: string; email: string } | null = null;
        try {
            const user = await this.prismaService.user.findUnique({
                where: { userId },
            });
            if (!user) {
                throw new BadRequestException(`Không tìm thấy người dùng với ID: ${userId}`);
            }

            userBeforeUpdate = { name: user.name, email: user.email };

            const passwordHash = await handlerHashPassword(password);
            if (!passwordHash) {
                throw new InternalServerErrorException("Không thể tạo hash cho mật khẩu!");
            }

            const updateData = {
                name,
                email,
                phone,
                locationId,
                passwordHash,
                role,
            };

            await this.prismaService.user.update({
                where: { userId },
                data: updateData,
            });

            // --- BỔ SUNG LOG ---
            const logPayloadSuccess: LogEventPayload = {
                userId: userId,
                eventType: Severity.INFO,
                description: `Thông tin người dùng '${userBeforeUpdate.name}' (ID: ${userId}) đã được cập nhật.`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
            // --- KẾT THÚC BỔ SUNG ---

            return 'Cập nhật người dùng thành công!';

        } catch (error) {

            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                userId: userId,
                eventType: Severity.ERROR,
                description: `Lỗi khi cập nhật người dùng ID ${userId}: ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            console.error('Lỗi cập nhật người dùng:', error);
            throw new InternalServerErrorException('Có lỗi xảy ra khi cập nhật người dùng!');
        }
    }

    async deleteMany(deleteUsersDto: DeleteUsersDto): Promise<string> {
        const { userIds } = deleteUsersDto;

        try {
            if (!userIds || userIds.length === 0) {
                throw new BadRequestException('Danh sách người dùng cần xóa không hợp lệ!');
            }

            const result = await this.prismaService.$transaction(async (tx) => {
                const updateResult = await tx.user.updateMany({
                    where: { userId: { in: userIds } },
                    data: { role: Role.INACTIVE },
                });

                if (updateResult.count === 0) {
                    throw new BadRequestException('Không tìm thấy người dùng nào để cập nhật!');
                }

                return updateResult.count;
            });

            // --- BỔ SUNG LOG --- (Sau khi transaction thành công)
            const logPayloadSuccess: LogEventPayload = {
                eventType: Severity.INFO,
                description: `Đã chuyển trạng thái ${result} người dùng thành INACTIVE. IDs: ${userIds.join(', ')}.`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
            // --- KẾT THÚC BỔ SUNG ---

            return 'Đã chuyển trạng thái người dùng thành INACTIVE!';
        } catch (error) {

            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                eventType: Severity.ERROR,
                description: `Lỗi khi cập nhật trạng thái người dùng thành INACTIVE cho IDs [${userIds.join(', ')}]: ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            console.error('Lỗi khi cập nhật trạng thái người dùng:', error);
            throw new InternalServerErrorException('Đã xảy ra lỗi khi cập nhật trạng thái người dùng!');
        }
    }

    async getAllUsers(query: GetUsersRequestDto): Promise<FindAllUsersDto> {
        console.log(query);
        try {
            const page = Number(query.page) || 1;
            const items_per_page = Number(query.items_per_page) || 5;
            const { order, search, role, locationId } = query;
            const skip = (page - 1) * items_per_page;

            const [users, total] = await Promise.all([
                this.prismaService.user.findMany({
                    where: {
                        ...(search && {
                            OR: [
                                { name: { contains: search, mode: 'insensitive' } },
                                { email: { contains: search, mode: 'insensitive' } },
                                { phone: { contains: search, mode: 'insensitive' } },
                            ],
                        }),
                        ...(role !== 'ALL' && { role }),
                        ...(locationId !== 'ALL' && { locationId }),
                    },
                    orderBy: { updatedAt: order === 'asc' ? 'asc' : 'desc' },
                    take: items_per_page,
                    skip: skip,
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        updatedAt: true,
                        locationId: true,
                    },
                }),
                this.prismaService.user.count({
                    where: {
                        ...(search && {
                            OR: [
                                { name: { contains: search, mode: 'insensitive' } },
                                { email: { contains: search, mode: 'insensitive' } },
                                { phone: { contains: search, mode: 'insensitive' } },
                            ],
                        }),
                        ...(role !== 'ALL' && { role }),
                        ...(locationId !== 'ALL' && { locationId }),
                    },
                }),
            ]);

            const lastPage = Math.ceil(total / items_per_page);
            const nextPage = page + 1 > lastPage ? null : page + 1;
            const prevPage = page - 1 < 1 ? null : page - 1;

            return {
                users: users.map(user => ({
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    phone: user.phone ?? '',
                    role: user.role,
                    updatedAt: user.updatedAt,
                    locationId: user.locationId ?? '',
                })),
                total,
                currentPage: page,
                nextPage,
                prevPage,
                lastPage,
            };
        } catch (error) {
            console.error('Lỗi khi lấy danh sách người dùng:', error);
            throw new InternalServerErrorException('Đã xảy ra lỗi khi lấy danh sách người dùng!');
        }
    }

    async findByEmail(email: string): Promise<FindByEmailDto> {
        try {
            const user = await this.prismaService.user.findUnique({
                where: { email },
                select: {
                    userId: true,
                    email: true,
                    name: true,
                    passwordHash: true,
                    role: true,
                },
            });

            if (!user) {
                throw new ForbiddenException('Email hoặc mật khẩu sai!');
            }

            return {
                userId: user.userId,
                email: user.email,
                name: user.name,
                password: user.passwordHash,
                role: user.role,
            };
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }

            throw new InternalServerErrorException('Internal server error');
        }
    }

    async updatePassword(email: string, password: string): Promise<void> {
        try {
            const passwordHash = await handlerHashPassword(password);
            console.log(passwordHash)
            console.log(password)
            await this.prismaService.user.update({
                where: { email },
                data: {
                    passwordHash,
                    updatedAt: dayjs().toDate(),
                },
            });
        } catch (error) {
            console.error(`Lỗi khi cập nhật mật khẩu cho user ID ${email}:`, error);
            throw new InternalServerErrorException('Lỗi khi cập nhật mật khẩu.');
        }
    }
}
