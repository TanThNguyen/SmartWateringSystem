export enum DeviceType {
    PUMP = "PUMP",
    MOISTURE_SENSOR = "MOISTURE_SENSOR",
    DHT20_SENSOR = "DHT20_SENSOR",
    LCD = "LCD",
    FAN = "FAN",
    LED = "LED"
}

// Các loại trạng thái thiết bị, dựa trên enum DeviceStatus từ backend
export type DeviceStatus = 'ACTIVE' | 'INACTIVE';

// Loại cho các thuộc tính của thiết bị Pump
export type PumpAttributes = {
    isRunning?: boolean;
    mode?: 'AUTO' | 'MANUAL'; // Giả sử có 2 chế độ là AUTO và MANUAL
};

// Loại cho các thuộc tính của thiết bị Fan
export type FanAttributes = {
    isRunning?: boolean;
    mode?: 'AUTO' | 'MANUAL';
    speed?: number;
};

// Loại cho các thuộc tính của thiết bị Moisture Sensor
export type MoistureSensorAttributes = {
    thresholdId?: string;
};

// Loại cho các thuộc tính của thiết bị DHT20 Sensor
export type DHT20SensorAttributes = {
    tempMinId?: string;
    tempMaxId?: string;
    humidityThresholdId?: string;
};

// Thông tin chi tiết của một thiết bị (dùng trong FindAllDevicesDto)
export type InfoDevicesType = {
    deviceId: string;
    type: DeviceType;
    name: string;
    locationName: string;
    updatedAt: string; // Chuyển từ Date sang string (dạng ISO)
    status: DeviceStatus;
};

// Định nghĩa dữ liệu trả về khi lấy tất cả thiết bị
export type FindAllDevicesType = {
    devices: InfoDevicesType[];
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    lastPage: number;
};

// Thông tin gửi khi thêm thiết bị mới
export type AddDeviceType = {
    name: string;
    locationName: string;
    type: DeviceType;
    status: DeviceStatus;
    thresholdId?: string;
    tempMinId?: string;
    tempMaxId?: string;
    humidityThresholdId?: string;
    speed?: string;
};

// Thông tin gửi khi xóa thiết bị
export type DeleteDevicesType = {
    deviceIds: string[];
};

// Thông tin gửi khi chỉnh sửa thiết bị
export type EditDeviceType = {
    deviceId: string;
    name?: string;
    status?: DeviceStatus;
    locationId?: string;
    pump?: PumpAttributes;
    fan?: FanAttributes;
    moistureSensor?: MoistureSensorAttributes;
    dht20Sensor?: DHT20SensorAttributes;
};

// Thông tin cho yêu cầu tìm kiếm thiết bị
export type GetDevicesRequestType = {
    page: number;
    items_per_page: number;
    search?: string;
    status?: DeviceStatus | 'ALL';
    locationName?: string;
    order?: string;
};

// Thông tin thiết bị cụ thể
export type DeviceIdType = {
    deviceId: string;
};
