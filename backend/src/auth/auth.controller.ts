import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { Public } from './decorator';

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
}
