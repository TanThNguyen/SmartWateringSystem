import { handleAPIError } from "../component/utils";
import { 
    ConfigurationCreateType, 
    ConfigurationUpdateType, 
    ConfigurationDeleteType, 
    ConfigurationQueryType, 
    ConfigurationFilterType,
    
} from "../types/configuration.type";
import axiosClient from "./axiosConfigs";

export const configurationApi = {
    
    getAllConfigurations: async (params: ConfigurationQueryType) => {
        try {
            const response = await axiosClient.get("/api/configurations", { params });
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    
    getConfigurationsByFilter: async (params: ConfigurationFilterType) => {
        try {
            const response = await axiosClient.get("/api/configurations/filter", { params });
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    
    createConfiguration: async (data: ConfigurationCreateType) => {
        try {
            const response = await axiosClient.post("/api/configurations", data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    
    updateConfiguration: async (data: ConfigurationUpdateType) => {
        try {
            const response = await axiosClient.put("/api/configurations", data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    
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
