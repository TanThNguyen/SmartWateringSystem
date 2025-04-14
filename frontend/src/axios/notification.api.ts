import { handleAPIError } from "../component/utils";
import axiosClient from "./axiosConfigs";


export const notiApi = {
    
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
