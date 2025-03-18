import { AllDeviceType, CreateDeviceType, DeviceRequestType } from "../types/device.type";
import axiosClient from "./axiosConfigs";
import environment from "../environment";

export const deviceAPI = {
    getAllDevice: async (params: DeviceRequestType): Promise<AllDeviceType> => {
        try {
            const response = await axiosClient.get<AllDeviceType>("/api/device/all", { params });
            console.log("getAllUsers", response.data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    createDevice: async (userData: CreateDeviceType): Promise<string> => {
        try {
            const response = await axiosClient.post<string>("/api/user/create", userData);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },



    deleteDevice: async (deviceIds: string[]): Promise<string> => {
        try {
            const response = await axiosClient.delete<string>("/api/device/delete", {
                data: { deviceIds },
            });
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },
};

const handleAPIError = (error: any) => {
    if (environment.dev === "true") {
        console.error(error);
    }
    const message =
        error?.response?.data?.message || "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.";
    alert(message);
};