import { IsString, IsOptional, IsUUID, IsArray, IsDate, IsNotEmpty } from 'class-validator';

export class CreateLocationDto {
    @IsString()
    name: string;
}

export class UpdateLocationDto {
    @IsUUID()
    @IsNotEmpty()
    locationId: string;

    @IsString()
    @IsOptional()
    name?: string;
}

export class DeleteLocationDto {
    @IsUUID()
    @IsNotEmpty()
    locationId: string;
}

export class GetLocationsRequestDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    order?: string;
}

export class InfoLocationDto {
    @IsUUID()
    @IsString()
    locationId: string;

    @IsString()
    name: string;

    @IsDate()
    createdAt: Date;

    @IsDate()
    updatedAt: Date;
}

export class FindAllLocationsDto {
    @IsArray()
    locations: InfoLocationDto[];
}