import { LocationRecordQueryType, SensorDataRequestType, SensorDataResponseType } from "../types/record.type";
import axiosClient from "../axios/axiosConfigs";
import { handleAPIError } from "../component/utils";

export const recordAPI = {
    getDeviceRecords: async (params: SensorDataRequestType) => {
        try {
            const response = await axiosClient.get("/api/records/device", { params });
            console.log("getDeviceRecords", response.data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    getLocationRecords: async (params: LocationRecordQueryType): Promise<SensorDataResponseType> => {
        try {
            const response = await axiosClient.get<SensorDataResponseType>("/api/records/location", { params });
            console.log("getLocationRecords", response.data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },
};
