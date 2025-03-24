export enum RecordType {
    MOISTURE = "MOISTURE",
    DHT20 = "DHT20"
}

export type AvgMoistureType = {
    soilMoisture?: number | null;
};

export type AvgDHT20Type = {
    temperature?: number | null;
    humidity?: number | null;
};

export type MoistureRecordType = {
    _avg: AvgMoistureType;
    timestamp: Date;
};

export type DHT20RecordType = {
    _avg: AvgDHT20Type;
    timestamp: Date;
};

export type SensorDataResponseType = {
    moisture?: MoistureRecordType[];
    dht20?: DHT20RecordType[];
};

export type DeviceRecordQueryType = {
    deviceId: string;
    start: string;
    stop: string;
};

export type LocationRecordQueryType = {
    locationId: string;
    start: string;
    stop: string;
};

export type SensorDataRequestType = {
    start: string;
    stop: string;
    deviceId?: string;
    locationId?: string;
};
