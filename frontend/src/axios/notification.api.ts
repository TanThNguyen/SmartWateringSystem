import { handleAPIError } from "../component/utils";
import axiosClient from "./axiosConfigs";

export const notiApi = {
    getUnreadCount: async() =>{
        try {
            const response = await axiosClient.get("/api/notification/unread-count");
            return {
                success: true,
                status: response.status,
                data: response.data,
              };
        } catch (error) {
            handleAPIError(error)
        }
    }
    // getNotifications: async (page: number, limit: number) => {
}