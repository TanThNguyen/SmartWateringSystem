import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SensorRecordFactory } from './sensors/sensor-record.factory';
import { LocationRecordQueryDto, SensorDataResponseDto } from './dto';

@Injectable()
export class RecordService {
    constructor(private prisma: PrismaService, private sensorFactory: SensorRecordFactory) { }

    async getDeviceRecords(deviceId: string, start: string, stop: string) {
        const device = await this.prisma.device.findUnique({
            where: { deviceId },
            select: { type: true },
        });

        if (!device) {
            throw new NotFoundException(`Không tìm thấy thiết bị với ID: ${deviceId}`);
        }

        const sensorService = this.sensorFactory.getService(device.type);
        return sensorService.getRecords(deviceId, start, stop);
    }

    async getLocationRecords(query: LocationRecordQueryDto): Promise<SensorDataResponseDto> {
        try {
            const { locationId, start, stop } = query;

            if (!locationId || !start || !stop) {
                throw new BadRequestException("Thiếu thông tin cần thiết (locationId, start, stop).");
            }

            const devices = await this.prisma.device.findMany({
                where: { locationId },
                select: { deviceId: true, type: true },
            });

            if (!devices.length) {
                throw new NotFoundException(`Không tìm thấy thiết bị nào tại khu vực ID: ${locationId}.`);
            }

            const moistureSensorIds = devices
                .filter((d) => d.type === "MOISTURE_SENSOR")
                .map((d) => d.deviceId);

            const dht20SensorIds = devices
                .filter((d) => d.type === "DHT20_SENSOR")
                .map((d) => d.deviceId);

            const moistureRecords = await this.prisma.moistureRecord.groupBy({
                by: ["timestamp"],
                where: {
                    sensorId: { in: moistureSensorIds },
                    timestamp: { gte: new Date(start), lte: new Date(stop) },
                },
                _avg: { soilMoisture: true },
                orderBy: { timestamp: "asc" },
            });

            const dht20Records = await this.prisma.dHT20Record.groupBy({
                by: ["timestamp"],
                where: {
                    sensorId: { in: dht20SensorIds },
                    timestamp: { gte: new Date(start), lte: new Date(stop) },
                },
                _avg: { temperature: true, humidity: true },
                orderBy: { timestamp: "asc" },
            });

            return {
                moisture: moistureRecords.map(record => ({
                    _avg: {
                        soilMoisture: record._avg.soilMoisture ?? 0, // hoặc undefined
                    },
                    timestamp: record.timestamp,
                })),
                dht20: dht20Records.map(record => ({
                    _avg: {
                        temperature: record._avg.temperature ?? 0,
                        humidity: record._avg.humidity ?? 0,
                    },
                    timestamp: record.timestamp,
                })),
            };

        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu cảm biến theo khu vực:", error);

            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException("Có lỗi xảy ra khi truy xuất dữ liệu cảm biến.");
        }
    }

}



// import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { SensorRecordFactory } from './sensors/sensor-record.factory';
// import { LocationRecordQueryDto, SensorDataResponseDto, MoistureRecordDto, DHT20RecordDto } from './dto';
// import { DeviceType, Prisma } from '@prisma/client';

// // --- CONSTANTS FOR TIME DURATIONS (in milliseconds) ---
// const MINUTE_MS = 60 * 1000;
// const HOUR_MS = 60 * MINUTE_MS;
// const DAY_MS = 24 * HOUR_MS;
// const FIFTEEN_MINUTES_MS = 15 * MINUTE_MS;

// // --- Helper Function for Dynamic Aggregation Interval (PostgreSQL Syntax - NEW LOGIC) ---
// function getAggregationSettings(start: Date, stop: Date): { unit: string, isRaw: boolean, sqlTrunc: string | null } {
//     const durationMs = stop.getTime() - start.getTime();

//     if (durationMs < 0) {
//         return { unit: 'raw', isRaw: true, sqlTrunc: null };
//     }
//     if (durationMs < FIFTEEN_MINUTES_MS) { // < 15 minutes
//         return { unit: 'raw', isRaw: true, sqlTrunc: null };
//     }
//     if (durationMs < HOUR_MS * 1) { // >= 15 minutes AND < 1 hour
//         return { unit: 'minute', isRaw: false, sqlTrunc: "DATE_TRUNC('minute', \"timestamp\")" };
//     }
//     if (durationMs < DAY_MS * 1) { // >= 1 hour AND < 1 day
//         return { unit: 'minute', isRaw: false, sqlTrunc: "DATE_TRUNC('minute', \"timestamp\")" };
//     }
//      if (durationMs < DAY_MS * 3) { // >= 1 day AND < 3 days
//         return { unit: 'hour', isRaw: false, sqlTrunc: "DATE_TRUNC('hour', \"timestamp\")" };
//     }
//     if (durationMs < DAY_MS * 7) { // >= 3 days AND < 7 days
//         return { unit: '4hour', isRaw: false, sqlTrunc: "DATE_TRUNC('day', \"timestamp\") + FLOOR(EXTRACT(HOUR FROM \"timestamp\") / 4) * INTERVAL '4 hours'" };
//     }
//     if (durationMs < DAY_MS * 30) { // >= 7 days AND < 30 days (approx 1 month)
//         return { unit: 'day', isRaw: false, sqlTrunc: "DATE_TRUNC('day', \"timestamp\")" };
//     }
//     const fiveDaysInSeconds = 5 * 24 * 60 * 60;
//     const fifteenDaysInSeconds = 15 * 24 * 60 * 60;

//     if (durationMs < DAY_MS * 90) { // >= 30 days (1 month) AND < 90 days (3 months)
//         return { unit: '5day', isRaw: false, sqlTrunc: `TO_TIMESTAMP(FLOOR(EXTRACT(EPOCH FROM "timestamp") / ${fiveDaysInSeconds}) * ${fiveDaysInSeconds})` };
//     }
//     if (durationMs < DAY_MS * 365) { // >= 90 days (3 months) AND < 365 days (1 year)
//         return { unit: '15day', isRaw: false, sqlTrunc: `TO_TIMESTAMP(FLOOR(EXTRACT(EPOCH FROM "timestamp") / ${fifteenDaysInSeconds}) * ${fifteenDaysInSeconds})` };
//     }
//     // >= 1 year
//     return { unit: 'month', isRaw: false, sqlTrunc: "DATE_TRUNC('month', \"timestamp\")" };
// }


// // --- Interfaces for Raw Query Results ---
// interface AggregatedMoistureRecord {
//     timestamp: Date;
//     avg_soil_moisture: number | null;
// }

// interface AggregatedDht20Record {
//     timestamp: Date;
//     avg_temperature: number | null;
//     avg_humidity: number | null;
// }

// // Interface for Raw Data (needed for mapping to DTO)
// interface RawMoistureRecord {
//     timestamp: Date;
//     soilMoisture: number; // Actual value, not avg
// }

// interface RawDht20Record {
//     timestamp: Date;
//     temperature: number; // Actual value, not avg
//     humidity: number;    // Actual value, not avg
// }

// // --- Helper function for rounding ---
// function roundToOneDecimal(value: number | null): number | null {
//     if (value === null || value === undefined || isNaN(value)) {
//         return null; // Return null if input is null, undefined, or NaN
//     }
//     // Use toFixed for rounding control, then parse back to float
//     return parseFloat(value.toFixed(1));
// }


// @Injectable()
// export class RecordService {
//     constructor(
//         private prisma: PrismaService,
//         private sensorFactory: SensorRecordFactory
//     ) { }

//     // --- getDeviceRecords remains unchanged ---
//     async getDeviceRecords(deviceId: string, start: string, stop: string) {
//         // ... (implementation remains the same)
//         const device = await this.prisma.device.findUnique({
//             where: { deviceId },
//             select: { type: true },
//         });

//         if (!device) {
//             throw new NotFoundException(`Không tìm thấy thiết bị với ID: ${deviceId}`);
//         }
//         const sensorService = this.sensorFactory.getService(device.type);
//         if (!sensorService) {
//              throw new InternalServerErrorException(`Không tìm thấy service xử lý cho loại thiết bị: ${device.type}`);
//         }
//         return sensorService.getRecords(deviceId, start, stop);
//     }

//     // --- Rewritten getLocationRecords with NEW Dynamic Aggregation AND Rounding ---
//     async getLocationRecords(query: LocationRecordQueryDto): Promise<SensorDataResponseDto> {
//         const { locationId, start, stop } = query;

//         // 1. Validation (same as before)
//         let startDate: Date;
//         let stopDate: Date;
//         try {
//             startDate = new Date(start);
//             stopDate = new Date(stop);
//             if (isNaN(startDate.getTime()) || isNaN(stopDate.getTime())) {
//                 throw new Error("Invalid date conversion");
//             }
//             if (startDate >= stopDate) {
//                  throw new BadRequestException("Ngày bắt đầu phải trước ngày kết thúc.");
//             }
//         } catch (e) {
//             throw new BadRequestException(`Định dạng ngày tháng không hợp lệ cho 'start' hoặc 'stop'. Sử dụng định dạng ISO 8601.`);
//         }

//         try {
//             // 2. Find devices (same as before)
//             const devices = await this.prisma.device.findMany({
//                 where: { locationId },
//                 select: { deviceId: true, type: true },
//             });

//             if (!devices.length) {
//                 console.log(`Không tìm thấy thiết bị nào tại khu vực ID: ${locationId}. Trả về kết quả rỗng.`);
//                 return { moisture: [], dht20: [] };
//             }

//             // 3. Separate sensor IDs (same as before)
//             const moistureSensorIds = devices
//                 .filter((d) => d.type === DeviceType.MOISTURE_SENSOR)
//                 .map((d) => d.deviceId);

//             const dht20SensorIds = devices
//                 .filter((d) => d.type === DeviceType.DHT20_SENSOR)
//                 .map((d) => d.deviceId);

//              if (moistureSensorIds.length === 0 && dht20SensorIds.length === 0) {
//                  console.log(`Không tìm thấy cảm biến MOISTURE hoặc DHT20 tại khu vực ID: ${locationId}. Trả về kết quả rỗng.`);
//                  return { moisture: [], dht20: [] };
//              }

//             // 4. Determine Aggregation Settings (same as before)
//             const { unit, isRaw, sqlTrunc } = getAggregationSettings(startDate, stopDate);

//             let moistureResponse: MoistureRecordDto[] = [];
//             let dht20Response: DHT20RecordDto[] = [];

//             // 5. Execute Queries (Raw or Aggregated) with Rounding
//             if (isRaw) {
//                 // --- RAW DATA PATH ---
//                 if (moistureSensorIds.length > 0) {
//                     const rawMoisture = await this.prisma.moistureRecord.findMany({
//                         where: {
//                             sensorId: { in: moistureSensorIds },
//                             timestamp: { gte: startDate, lte: stopDate },
//                         },
//                         select: { timestamp: true, soilMoisture: true },
//                         orderBy: { timestamp: 'asc' },
//                     });
//                     // Map raw data to DTO structure and ROUND the value
//                     moistureResponse = rawMoisture.map(record => ({
//                         _avg: {
//                             // Apply rounding here
//                             soilMoisture: roundToOneDecimal(record.soilMoisture)
//                         },
//                         timestamp: record.timestamp,
//                     }));
//                 }

//                 if (dht20SensorIds.length > 0) {
//                      const rawDht20 = await this.prisma.dHT20Record.findMany({
//                         where: {
//                             sensorId: { in: dht20SensorIds },
//                             timestamp: { gte: startDate, lte: stopDate },
//                         },
//                         select: { timestamp: true, temperature: true, humidity: true },
//                         orderBy: { timestamp: 'asc' },
//                     });
//                     // Map raw data to DTO structure and ROUND the values
//                     dht20Response = rawDht20.map(record => ({
//                         _avg: {
//                             // Apply rounding here
//                             temperature: roundToOneDecimal(record.temperature),
//                             humidity: roundToOneDecimal(record.humidity),
//                          },
//                         timestamp: record.timestamp,
//                     }));
//                 }

//             } else {
//                 // --- AGGREGATED DATA PATH ---
//                 if (moistureSensorIds.length > 0 && sqlTrunc) {
//                     const aggregatedMoisture = await this.prisma.$queryRaw<AggregatedMoistureRecord[]>`
//                         SELECT
//                             ${Prisma.raw(sqlTrunc)} as timestamp,
//                             AVG("soilMoisture")::float as avg_soil_moisture
//                         FROM "MoistureRecord"
//                         WHERE "sensorId" IN (${Prisma.join(moistureSensorIds)})
//                           AND "timestamp" >= ${startDate}
//                           AND "timestamp" <= ${stopDate}
//                         GROUP BY 1 ORDER BY 1 ASC;
//                     `;
//                      // Map aggregated data to DTO structure and ROUND the value
//                      moistureResponse = aggregatedMoisture.map(record => ({
//                         _avg: {
//                             // Apply rounding here
//                             soilMoisture: roundToOneDecimal(record.avg_soil_moisture)
//                         },
//                         timestamp: record.timestamp,
//                     }));
//                 }

//                 if (dht20SensorIds.length > 0 && sqlTrunc) {
//                      const aggregatedDht20 = await this.prisma.$queryRaw<AggregatedDht20Record[]>`
//                         SELECT
//                             ${Prisma.raw(sqlTrunc)} as timestamp,
//                             AVG("temperature")::float as avg_temperature,
//                             AVG("humidity")::float as avg_humidity
//                         FROM "DHT20Record"
//                         WHERE "sensorId" IN (${Prisma.join(dht20SensorIds)})
//                           AND "timestamp" >= ${startDate}
//                           AND "timestamp" <= ${stopDate}
//                         GROUP BY 1 ORDER BY 1 ASC;
//                     `;
//                      // Map aggregated data to DTO structure and ROUND the values
//                      dht20Response = aggregatedDht20.map(record => ({
//                         _avg: {
//                             // Apply rounding here
//                             temperature: roundToOneDecimal(record.avg_temperature),
//                             humidity: roundToOneDecimal(record.avg_humidity),
//                         },
//                         timestamp: record.timestamp,
//                     }));
//                 }
//             }

//             // 6. Return mapped and rounded results
//             return {
//                 moisture: moistureResponse,
//                 dht20: dht20Response,
//             };

//         } catch (error) {
//             // --- Error Handling (same as before) ---
//             // console.error(`Lỗi khi lấy dữ liệu cảm biến (Unit: ${unit ?? 'N/A'}) cho khu vực ${locationId} [${start} -> ${stop}]:`, error);
//             if (error instanceof BadRequestException || error instanceof NotFoundException) { throw error; }
//             if (error instanceof Prisma.PrismaClientKnownRequestError) { console.error("Prisma Known Request Error:", { code: error.code, meta: error.meta, message: error.message });}
//             else if (error instanceof Prisma.PrismaClientValidationError) { console.error("Prisma Validation Error:", error.message); }
//             throw new InternalServerErrorException("Có lỗi không mong muốn xảy ra khi truy xuất dữ liệu cảm biến.");
//         }
//     }
// }