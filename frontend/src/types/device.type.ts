// src/types/device.type.ts
export enum DeviceType {
    PUMP = "PUMP",
    MOISTURE_SENSOR = "MOISTURE_SENSOR",
    DHT20_SENSOR = "DHT20_SENSOR",
    LCD = "LCD",
    FAN = "FAN",
    LED = "LED"
    // Add RELAY if needed based on your Add Modal options
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
    speed?: number; // Keep for type definition, even if not used in forms
};

export type MoistureSensorAttributes = {
    thresholdId?: string; // This IS the configurationId
};

export type DHT20SensorAttributes = {
    tempMinId?: string;         // ConfigurationId
    tempMaxId?: string;         // ConfigurationId
    humidityThresholdId?: string; // ConfigurationId
};

// *** Make sure this matches your CURRENT version ***
export type InfoDevicesType = {
    deviceId: string;
    type: DeviceType;
    name: string;
    locationId: string;
    updatedAt: string;
    status: DeviceStatus;
    // --- IMPORTANT ---
    // For EDIT pre-filling, the backend ideally should include these here
    // OR you need getOneDevice to return them.
    moisture_sensor?: MoistureSensorAttributes;
    dht20_sensor?: DHT20SensorAttributes;
    // Add other attributes if needed (fan, pump)
};

// Type returned by getOneDevice (should include all details)
export type DeviceDetailType = InfoDevicesType & { // Extend InfoDevicesType
    // Add any other specific details returned by getOneDevice if necessary
    // Example: might include specific attributes directly
    // thresholdId?: string; // Example if directly on the object
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
    thresholdId?: string;       // configId for moisture
    tempMinId?: string;         // configId for dht
    tempMaxId?: string;         // configId for dht
    humidityThresholdId?: string; // configId for dht
    // speed is omitted as requested for forms, but keep in FanAttributes type
};

export type DeleteDevicesType = {
    deviceIds: string[];
};

export type EditDeviceType = {
    deviceId: string;
    name?: string;
    status?: DeviceStatus;
    locationId?: string;
    // Send attributes nested as defined in backend DTOs
    moisture_sensor?: MoistureSensorAttributes;
    dht20_sensor?: DHT20SensorAttributes;
    // fan?: FanAttributes; // Add if fan attributes become editable
    // pump?: PumpAttributes; // Add if pump attributes become editable
};

export type GetDevicesRequestType = {
    page: number;
    items_per_page: number;
    search?: string;
    status?: DeviceStatus | 'ALL';
    locationId?: string; // Filter by ID if API supports it, else keep locationName
    order?: string;
};

export type DeviceIdType = {
    deviceId: string;
};