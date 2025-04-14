
export enum DeviceType {
    PUMP = "PUMP",
    MOISTURE_SENSOR = "MOISTURE_SENSOR",
    DHT20_SENSOR = "DHT20_SENSOR",
    LCD = "LCD",
    FAN = "FAN",
    LED = "LED"
}

export enum DeviceStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE'
}

export type PumpAttributes = {
    isRunning?: boolean;
    mode?: 'AUTO' | 'MANUAL';
};

export type FanAttributes = {
    isRunning?: boolean;
    mode?: 'AUTO' | 'MANUAL';
    speed?: number; 
};

export type MoistureSensorAttributes = {
    thresholdId?: string; 
};

export type DHT20SensorAttributes = {
    tempMinId?: string;         
    tempMaxId?: string;        
    humidityThresholdId?: string; 
};


export type InfoDevicesType = {
    deviceId: string;
    type: DeviceType;
    name: string;
    locationId: string;
    updatedAt: string;
    status: DeviceStatus;
    moisture_sensor?: MoistureSensorAttributes;
    dht20_sensor?: DHT20SensorAttributes;
};

export type DeviceDetailType = InfoDevicesType & {

};


export type FindAllDevicesType = {
    devices: InfoDevicesType[];
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    lastPage: number;
};

export type AddDeviceType = {
    name: string;
    locationId: string;
    type: DeviceType;
    status: DeviceStatus;
    thresholdId?: string;      
    tempMinId?: string;        
    tempMaxId?: string;         
    humidityThresholdId?: string; 
};

export type DeleteDevicesType = {
    deviceIds: string[];
};

export type EditDeviceType = {
    deviceId: string;
    name?: string;
    status?: DeviceStatus;
    locationId?: string;

    moisture_sensor?: MoistureSensorAttributes;
    dht20_sensor?: DHT20SensorAttributes;
};

export type GetDevicesRequestType = {
    page: number;
    items_per_page: number;
    search?: string;
    status?: DeviceStatus | 'ALL';
    locationId?: string; 
    order?: string;
};

export type DeviceIdType = {
    deviceId: string;
};