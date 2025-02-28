import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID, IsArray, IsDate } from "class-validator";
import { Role } from '@prisma/client';

export class FindByEmailDto {
    @IsUUID()
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsEmail()
    @IsString()
    email: string;

    @IsString()
    password: string;

    @IsEnum(Role)
    role: Role;
}

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsString()
    email: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsEnum(Role)
    role: Role;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class UpdateUserDto {
    @IsUUID()
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsString()
    email: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsEnum(Role)
    role: Role;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class DeleteUsersDto {
    @IsArray()
    @IsUUID("4", { each: true })
    @IsNotEmpty()
    userIds: string[];
}

export class InfoUsersDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsString()
    email: string;

    @IsString()
    address: string;

    @IsString()
    phone: string;

    @IsEnum(Role)
    role: Role;

    @IsDate()
    @IsNotEmpty()
    updatedAt: Date;
}

export class FindAllUsersDto {
    @IsArray()
    users: InfoUsersDto[];
}