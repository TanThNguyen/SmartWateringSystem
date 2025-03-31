// Tạo type cho các giá trị DeviceType (có thể nhận từ backend hoặc là các giá trị mặc định).
export type DeviceType = 'PUMP' | 'MOISTURE_SENSOR' | 'DHT20_SENSOR' | 'LCD' | 'FAN' | 'LED';

// Type cho ConfigurationCreateDto
export type ConfigurationCreateType = {
    name: string;
    value: number;
    locationId: string;
    deviceType: DeviceType;  // Sử dụng chuỗi cho deviceType
};

// Type cho ConfigurationUpdateDto
export type ConfigurationUpdateType = {
    configId: string;
    name: string;
    value: number;
    locationId: string;
    deviceType: DeviceType;  // Sử dụng chuỗi cho deviceType
};

// Type cho ConfigurationDeleteDto
export type ConfigurationDeleteType = {
    configId: string;
};

// Type đầu vào cho hàm yêu cầu API để lấy danh sách cấu hình getAllConfigurations
export type ConfigurationQueryType = {
    page: number;
    items_per_page: number;
    search?: string;
    deviceType?: DeviceType | 'ALL';  // 'ALL' là giá trị tùy chọn
};

// Type cho ConfigurationDetailDto
export type ConfigurationDetailType = {
    configId: string;
    name: string;
    value: number;
    locationId: string;
    deviceType: DeviceType;  // Sử dụng chuỗi cho deviceType
    lastUpdated: string;  // Date dưới dạng string
};

// Type để hàm  getAllConfigurations trả về 
export type ConfigurationPaginatedType = {
    configurations: ConfigurationDetailType[];
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    lastPage: number;
};

// Type cho ConfigurationFilterDto
export type ConfigurationFilterType = {
    locationId: string;
    deviceType: DeviceType;  // Sử dụng chuỗi cho deviceType
};

// Type cho ConfigurationListDto
