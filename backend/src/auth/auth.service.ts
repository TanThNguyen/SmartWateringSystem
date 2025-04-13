import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { handlerComparePassword } from 'src/helper/util';
import { UserService } from 'src/user/user.service';
import { ChangePasswordDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UserService,
        private jwtService: JwtService,
    ) { }

    async signIn(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        const isValidPassword = await handlerComparePassword(pass, user.password);
        if (!isValidPassword) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { userId: user.userId, email: user.email, role: user.role };
        return {
            id: user.userId,
            email: user.email,
            name: user.name,
            role: user.role,
            accessToken: await this.jwtService.signAsync(payload),
        };
    }

    // async validateUser(email: string, password: string): Promise<any> {
    //     const user = await this.usersService.findByEmail(email);
    //     const isValidPassword = await handlerComparePassword(password, user.password);
    //     if (!isValidPassword || !user) {
    //         return null;
    //     }
    //     return user;
    //     const payload = { userId: user.userId, email: user.email, role: user.role };
    //     return {
    //         access_token: await this.jwtService.signAsync(payload),
    //     };
    // }

    // Todo: Implement resend code functionality
    async resendCode(): Promise<string> {
        return "Code sent successfully!";
    }

    // Todo: Implement reset password functionality
    async resetPassword(): Promise<string> {
        return "Reset password email sent successfully!";
    }

    async changePassword(email: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
        const { currentPassword, newPassword, newPasswordConfirm } = changePasswordDto;

        if (newPassword !== newPasswordConfirm) {
            throw new BadRequestException('Mật khẩu mới và xác nhận mật khẩu mới không khớp.');
        }

        try {
            const user = await this.usersService.findByEmail(email);
            if (!user || !user.password) {
                throw new UnauthorizedException('Người dùng không hợp lệ.');
            }

            const isCurrentPasswordValid = await handlerComparePassword(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new UnauthorizedException('Mật khẩu hiện tại không đúng.');
            }
            console.log(email, newPassword)

            await this.usersService.updatePassword(user.email, newPassword);

            return { message: "Đổi mật khẩu thành công." };

        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof BadRequestException || error instanceof NotFoundException || error instanceof InternalServerErrorException) {
                throw error;
            }
            console.error("Lỗi khi đổi mật khẩu:", error);
            throw new InternalServerErrorException('Có lỗi xảy ra khi đổi mật khẩu, vui lòng thử lại.');
        }
    }
}