import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, FindByEmailDto, DeleteUsersDto, UpdateUserDto, FindAllUsersDto, InfoUsersDto } from './dto';
import { Role } from '@prisma/client';
import { handlerHashPassword } from 'src/helper/util';

@Injectable()
export class UserService {
    constructor(
        private prismaService: PrismaService,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<string> {
        const { name, email, address, phone, role, password } = createUserDto;

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

        try {
            const user = await this.prismaService.user.create({
                data: {
                    name,
                    email,
                    phone,
                    address,
                    passwordHash,
                    role,
                },
            });

            return user.email;
        } catch (error) {
            console.error('Lỗi tạo user:', error.message);
            throw new InternalServerErrorException('Lỗi khi tạo người dùng!');
        }
    }async update(updateUserDto: UpdateUserDto): Promise<string> {
        try {
            const { userId, name, email, address, phone, role, password } = updateUserDto;
    
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
                address,
                passwordHash,
                role,
            };
    
            await this.prismaService.user.update({
                where: { userId },
                data: updateData,
            });
    
            return 'User updated successfully!';
        } catch (error) {
            console.error('Lỗi cập nhật người dùng:', error);
            throw new InternalServerErrorException('Có lỗi xảy ra khi cập nhật người dùng!');
        }
    }
    


    async deleteMany(deleteUsersDto: DeleteUsersDto): Promise<string> {
        const { userIds } = deleteUsersDto;

        await this.prismaService.user.updateMany({
            where: { userId: { in: userIds } },
            data: { role: Role.INACTIVE },
        });

        return 'Users marked as INACTIVE!';
    }

    async getAllUsers(): Promise<FindAllUsersDto> {
        const users = await this.prismaService.user.findMany({
            select: {
                name: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                updatedAt: true,
            },
        });
    
        // Chuyển null thành chuỗi rỗng ("") để khớp DTO
        const formattedUsers: InfoUsersDto[] = users.map(user => ({
            name: user.name,
            email: user.email,
            phone: user.phone ?? "",   // Ép kiểu null -> ""
            address: user.address ?? "", // Ép kiểu null -> ""
            role: user.role,
            updatedAt: user.updatedAt,
        }));
    
        return { users: formattedUsers };
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
