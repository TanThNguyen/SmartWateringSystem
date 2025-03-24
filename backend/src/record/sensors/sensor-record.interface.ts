export interface SensorRecordService {
    getRecords(deviceId: string, start: string, stop: string): Promise<any>;
}