import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID, IsArray, IsDate, IsOptional, IsInt, Min, IsNumber, Matches } from "class-validator";
import { Role } from '@prisma/client';
import { Transform, Type } from "class-transformer";

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

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    locationId: string;

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

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    locationId: string;

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

export class GetUsersRequestDto {
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    items_per_page: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => value?.toUpperCase() || 'ALL')
    @Matches(/^(ADMIN|GARDENER|INACTIVE|ALL)$/, {
        message: 'role phải là giá trị hợp lệ của Role hoặc "ALL"',
    })
    role?: Role | 'ALL' = 'ALL';

    @IsOptional()
    @IsString()
    order?: string;
}

export class InfoUsersDto {

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

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    locationName: string;

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

    @IsNumber()
    total: number;

    @IsNumber()
    currentPage: number;

    @IsNumber()
    nextPage: number | null;

    @IsNumber()
    prevPage: number | null;

    @IsNumber()
    lastPage: number;
}