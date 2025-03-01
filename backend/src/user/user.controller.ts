import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, DeleteUsersDto, FindAllUsersDto, GetUsersRequestDto, UpdateUserDto } from './dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('create')
    create(@Body() createUserDto: CreateUserDto): Promise<String> {
        return this.userService.create(createUserDto);
    }

    @Put('edit')
    edit(@Body() updateUserDto: UpdateUserDto): Promise<String> {
        return this.userService.update(updateUserDto);
    }

    @Delete('delete')
    delete(@Body() deleteUsersDto: DeleteUsersDto): Promise<String> {
        return this.userService.deleteMany(deleteUsersDto);
    }

    @Get('all')
    async getAllUsers(@Query() query: GetUsersRequestDto): Promise<FindAllUsersDto> {
        return await this.userService.getAllUsers(query);
    }

    
}
