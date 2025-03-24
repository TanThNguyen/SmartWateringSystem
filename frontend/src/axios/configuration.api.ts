import { handleAPIError } from "../component/utils";
import { 
    ConfigurationCreateType, 
    ConfigurationUpdateType, 
    ConfigurationDeleteType, 
    ConfigurationQueryType, 
    ConfigurationFilterType 
} from "../types/configuration.type";
import axiosClient from "./axiosConfigs";

export const configurationApi = {
    // Lấy tất cả các cấu hình với phân trang
    getAllConfigurations: async (params: ConfigurationQueryType) => {
        try {
            const response = await axiosClient.get("/api/configurations", { params });
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    // Lọc cấu hình theo điều kiện
    getConfigurationsByFilter: async (params: ConfigurationFilterType) => {
        try {
            const response = await axiosClient.get("/api/configurations/filter", { params });
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    // Tạo mới cấu hình
    createConfiguration: async (data: ConfigurationCreateType) => {
        try {
            const response = await axiosClient.post("/api/configurations", data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    // Cập nhật cấu hình
    updateConfiguration: async (data: ConfigurationUpdateType) => {
        try {
            const response = await axiosClient.put("/api/configurations", data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    // Xóa cấu hình
    deleteConfiguration: async (data: ConfigurationDeleteType) => {
        try {
            const response = await axiosClient.delete("/api/configurations", { data });
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    }
}
