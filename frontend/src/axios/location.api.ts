import { handleAPIError } from "../component/utils";
import { GetLocationsRequestType } from "../types/location.type";
import axiosClient from "./axiosConfigs";

export const locationApi = {
    getAllLocations: async (params: GetLocationsRequestType) => {
        try {
            const response = await axiosClient.get("/api/location/all", { params });
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }

    }
}