import { Severity } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches } from "class-validator";

export class CreateNotiDto {

    @IsOptional()
    senderId: string;

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsNotEmpty()
    @Transform(({ value }) => value?.toUpperCase())
    @Matches(/^(INFO|WARNING|ERROR)$/, {
        message: 'Severity phải là giá trị hợp lệ của Severity',
    })
    severity: Severity;

    @IsArray()
    recipientIds: string[];
}

export class InfoNotiDto {

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    notificationId: string;

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    senderId: string;

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsEnum(Severity)
    severity: Severity;

    @IsBoolean()
    isRead: Boolean;

    @IsDate()
    createdAt: Date;
}

export class FindAllNotisDto {
    @IsArray()
    notifications: InfoNotiDto[];
}

export class OneNotiRequestDto {

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    notificationId: string;
}