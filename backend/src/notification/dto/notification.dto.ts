import { Severity } from "@prisma/client";
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";


export class InfoNotiDto {
    @IsUUID()
    @IsString()
    @IsNotEmpty()
    notificationId: string;

    @IsOptional() 
    @IsUUID()
    @IsString()
    senderId?: string | null; 

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsEnum(Severity)
    severity: Severity;

    @IsBoolean()
    isRead: boolean; 

    @IsDate()
    createdAt: Date;
}

export class FindAllNotisDto {
    @IsArray()
    @ValidateNested({ each: true }) 
    @Type(() => InfoNotiDto)
    notifications: InfoNotiDto[];
}

export class OneNotiRequestDto {
    @IsUUID()
    @IsString()
    @IsNotEmpty()
    notificationId: string;
}

export const NOTIFICATION_EVENT = 'notification.event.created';

export class NotificationEventContext {
    @IsOptional()
    @IsUUID()
    deviceId?: string;

    @IsOptional()
    @IsUUID()
    userId?: string; 

    @IsOptional()
    @IsString()
    scheduleId?: string;

    @IsOptional()
    value?: number | string;

    @IsOptional()
    threshold?: number | string;

     @IsOptional()
    @IsString()
    errorMessage?: string;
}

export class NotificationEventPayload {
    @IsOptional()
    @IsUUID()
    senderId?: string | null; 

    @IsEnum(Severity)
    severity: Severity;

    @IsString()
    @IsNotEmpty()
    messageTemplate: string; 

    @IsOptional()
    @IsObject()
    @ValidateNested() 
    @Type(() => NotificationEventContext)
    context?: NotificationEventContext; 

    @IsOptional()
    @IsArray()
    @IsUUID("all", { each: true })
    explicitRecipientIds?: string[]; 
}
