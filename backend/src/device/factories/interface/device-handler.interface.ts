import { DeviceStatus, DeviceType, Prisma, PrismaClient } from '@prisma/client';
import { AddDeviceDto, EditDeviceDto } from '../../dto';


export type PrismaTransactionClient = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface IDeviceHandler {
  /**
   * Tạo các bản ghi liên quan đặc thù cho loại thiết bị (Pump, Fan, Sensor...).
   * @param prisma - Prisma client (có thể là transactional client).
   * @param deviceId - ID của bản ghi Device vừa được tạo.
   * @param data - Dữ liệu từ AddDeviceDto.
   */
  createSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: AddDeviceDto): Promise<void>;

  /**
   * Cập nhật các bản ghi/trường liên quan đặc thù cho loại thiết bị.
   * @param prisma - Prisma client (có thể là transactional client).
   * @param deviceId - ID của bản ghi Device.
   * @param data - Dữ liệu từ EditDeviceDto chứa các thuộc tính cần cập nhật.
   */
  updateSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: EditDeviceDto): Promise<void>;

   /**
   * Lấy thông tin chi tiết đặc thù cho loại thiết bị.
   * @param prisma - Prisma client.
   * @param deviceId - ID của bản ghi Device.
   * @returns - Object chứa thông tin chi tiết hoặc null/undefined nếu không có.
   */
   getSpecifics(prisma: PrismaClient | PrismaTransactionClient, deviceId: string): Promise<any | null>;

   /**
    * (Optional but recommended) Kiểm tra dữ liệu đầu vào khi thêm mới.
    * Ném lỗi (vd: BadRequestException) nếu dữ liệu không hợp lệ.
    * @param data - Dữ liệu từ AddDeviceDto.
    */
   validateAddData?(data: AddDeviceDto): void;

  /**
   * Xử lý logic bật/tắt trạng thái cho thiết bị.
   * @param prisma - Prisma client (có thể là transactional client).
   * @param device - Thông tin thiết bị hiện tại (bao gồm status và type).
   * @returns Trạng thái mới (ACTIVE hoặc INACTIVE) của thiết bị.
   * @throws BadRequestException nếu không thể toggle (ví dụ: sensor đang ACTIVE).
   */
  toggleStatus(prisma: PrismaTransactionClient, device: { deviceId: string; status: DeviceStatus; type: DeviceType /*Thêm các trường khác nếu cần*/ }): Promise<DeviceStatus>;
}