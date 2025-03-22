import { GetLogsRequestType, FindAllLogsType } from "../types/log.type";
import axiosClient from "../axios/axiosConfigs";
import environment from "../environment";

export const logAPI = {
    getAllLogs: async (params: GetLogsRequestType): Promise<FindAllLogsType> => {
        try {
            const response = await axiosClient.get<FindAllLogsType>("/api/log/all", { params });
            console.log("getAllLogs", response.data);
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
