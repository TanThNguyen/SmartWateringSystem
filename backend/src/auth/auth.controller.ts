import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto } from './dto';
import { GetUser, Public } from './decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Post('login')
    @Public()
    async signIn(@Body() loginDto: LoginDto): Promise<any> {
        return await this.authService.signIn(
            loginDto.email,
            loginDto.password
        );
    }


    // Todo
    @Post('resend-code')
    @Public()
    async resendCode(): Promise<string> {
        return await this.authService.resendCode();
    }

    // Todo
    @Post('reset-password')
    @Public()
    async resetPassword(): Promise<string> {
        return await this.authService.resetPassword();
    }

    @Post('change-password')
    async changePassword(
        @GetUser() user: User,
        @Body() changePasswordDto: ChangePasswordDto
    ): Promise<{ message: string }> {
        console.log(changePasswordDto)
        const email = user.email;
        if (!email) {
            throw new UnauthorizedException('Xác thực thất bại.');
        }
        return await this.authService.changePassword(email, changePasswordDto);
    }
}
