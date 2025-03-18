export enum DeviceType {
    PUMP = "PUMP",
    MOISTURE_SENSOR = "MOISTURE_SENSOR",
    DHT20_SENSOR = "DHT20_SENSOR",
    LCD = "LCD",
    RELAY = "RELAY"
}

export type CreateDeviceType = {
    name: string;
    type: DeviceType;
    location: string;
    status: boolean;
};

export type InfoDeviceType = {
    deviceId: string;
    name: string;
    type: DeviceType;
    location: string;
    status: boolean;

}

export type AllDeviceType = {

    users: InfoDeviceType[];
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    lastPage: number;

}


export type DeviceRequestType = {

    page: number;
    items_per_page: number;
    search?: string;
    type?: string; 
    order?: string; // 'asc' or 'desc'

}