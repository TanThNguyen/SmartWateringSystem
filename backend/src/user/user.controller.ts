import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, DeleteUsersDto, FindAllUsersDto, GetUsersRequestDto, UpdateUserDto } from './dto';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { RoleGuard } from 'src/auth/guard/role.guard';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('me')
    me(@GetUser() user: User) {
      return user
    }

    @Post('create')
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    create(@Body() createUserDto: CreateUserDto): Promise<String> {
        return this.userService.create(createUserDto);
    }

    @Put('edit')
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    edit(@Body() updateUserDto: UpdateUserDto): Promise<String> {
        return this.userService.update(updateUserDto);
    }

    @Delete('delete')
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    delete(@Body() deleteUsersDto: DeleteUsersDto): Promise<String> {
        return this.userService.deleteMany(deleteUsersDto);
    }

    @Get('all')
    @UseGuards(RoleGuard)
    @SetMetadata('roles', ['ADMIN'])
    async getAllUsers(@Query() query: GetUsersRequestDto): Promise<FindAllUsersDto> {
        return this.userService.getAllUsers(query);
    }
}

