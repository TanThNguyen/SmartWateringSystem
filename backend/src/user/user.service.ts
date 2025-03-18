import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, FindByEmailDto, DeleteUsersDto, UpdateUserDto, FindAllUsersDto, InfoUsersDto, GetUsersRequestDto } from './dto';
import { Role } from '@prisma/client';
import { handlerHashPassword } from 'src/helper/util';

@Injectable()
export class UserService {
    constructor(
        private prismaService: PrismaService,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<string> {
        try {
            const { name, email, locationId, phone, role, password } = createUserDto;

            const isExist = await this.prismaService.user.findUnique({
                where: { email },
            });

            if (isExist) {
                throw new BadRequestException(`Email: ${email} đã tồn tại!`);
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

            return user.email;
        } catch (error) {
            console.error('Lỗi trong quá trình tạo người dùng:', error);
            if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error;
            }
            throw new InternalServerErrorException('Lỗi không xác định khi tạo người dùng!');
        }
    }

    async update(updateUserDto: UpdateUserDto): Promise<string> {
        try {
            const { userId, name, email, locationId, phone, role, password } = updateUserDto;

            const user = await this.prismaService.user.findUnique({
                where: { userId },
            });
            if (!user) {
                throw new BadRequestException(`Không tìm thấy người dùng với ID: ${userId}`);
            }

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

            return 'Cập nhật người dùng thành công!';

        } catch (error) {
            console.error('Lỗi cập nhật người dùng:', error);
            throw new InternalServerErrorException('Có lỗi xảy ra khi cập nhật người dùng!');
        }
    }

    async deleteMany(deleteUsersDto: DeleteUsersDto): Promise<string> {
        try {
            const { userIds } = deleteUsersDto;

            if (!userIds || userIds.length === 0) {
                throw new BadRequestException('Danh sách người dùng cần xóa không hợp lệ!');
            }

            await this.prismaService.$transaction(async (tx) => {
                const updateResult = await tx.user.updateMany({
                    where: { userId: { in: userIds } },
                    data: { role: Role.INACTIVE },
                });

                if (updateResult.count === 0) {
                    throw new BadRequestException('Không tìm thấy người dùng nào để cập nhật!');
                }
            });

            return 'Đã chuyển trạng thái người dùng thành INACTIVE!';
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái người dùng:', error);
            throw new InternalServerErrorException('Đã xảy ra lỗi khi cập nhật trạng thái người dùng!');
        }
    }

    async getAllUsers(query: GetUsersRequestDto): Promise<FindAllUsersDto> {
        try {
            const page = Number(query.page) || 1;
            const items_per_page = Number(query.items_per_page) || 5;
            const { order, search, role } = query;
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
                        location: { select: { name: true } },
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
                    phone: user.phone ?? "",
                    role: user.role,
                    updatedAt: user.updatedAt,
                    locationName: user.location?.name ?? "",
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
}
