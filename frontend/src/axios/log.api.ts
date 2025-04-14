import { GetLogsRequestType, FindAllLogsType } from "../types/log.type";
import axiosClient from "../axios/axiosConfigs";
import { handleAPIError } from "../component/utils";

export const logAPI = {
    getAllLogs: async (params: GetLogsRequestType): Promise<FindAllLogsType> => {
        try {
            const response = await axiosClient.get<FindAllLogsType>("/api/log/all", { params });
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },
};