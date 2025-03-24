import { handleAPIError } from "../component/utils";
import axiosClient from "./axiosConfigs";

// Định nghĩa notiApi với các phương thức cần thiết
export const notiApi = {
    // Lấy số lượng thông báo chưa đọc
    getUnreadCount: async () => {
        try {
            const response = await axiosClient.get("/api/notification/unread-count");
            return {
                success: true,
                status: response.status,
                data: response.data,
            };
        } catch (error) {
            handleAPIError(error);
        }
    },

    // Lấy tất cả thông báo của người dùng
    getAllNotifications: async () => {
        try {
            const response = await axiosClient.get("/api/notification/all");
            return {
                success: true,
                status: response.status,
                data: response.data,
            };
        } catch (error) {
            handleAPIError(error);
        }
    },

    // Lấy thông báo chi tiết theo ID
    getOneNotification: async (notificationId: string) => {
        try {
            const response = await axiosClient.get(`/api/notification/one?notificationId=${notificationId}`);
            return {
                success: true,
                status: response.status,
                data: response.data,
            };
        } catch (error) {
            handleAPIError(error);
        }
    },
};
