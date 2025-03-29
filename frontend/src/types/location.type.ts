export type CreateLocationType = {
    name: string;
};

export type UpdateLocationType = {
    locationId: string;
    name: string;
};

export type DeleteLocationType = {
    locationId: string;
};

export type GetLocationsRequestType = {
    search?: string;
    order?: string;
};

export type InfoLocationType = {
    locationId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
};

export type FindAllLocationsType = {
    locations: InfoLocationType[];
};
