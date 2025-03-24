import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { handlerComparePassword } from 'src/helper/util';
import { UserService } from 'src/user/user.service';

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
}