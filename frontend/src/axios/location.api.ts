import { handleAPIError } from "../component/utils";
import { GetLocationsRequestType, CreateLocationType, UpdateLocationType, DeleteLocationType } from "../types/location.type";
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
    },

    createLocation: async (data: CreateLocationType) => {
        try {
            const response = await axiosClient.post("/api/location/add", data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    updateLocation: async (data: UpdateLocationType) => {
        try {
            const response = await axiosClient.put("/api/location/edit", data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    deleteLocation: async (data: DeleteLocationType) => {
        try {
            const response = await axiosClient.delete("/api/location/delete", { data });
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    }
}
