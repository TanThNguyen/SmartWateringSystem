import { handleAPIError } from "../component/utils";
import {
    AddDeviceType,
    DeleteDevicesType,
    EditDeviceType,
    GetDevicesRequestType,
    DeviceIdType,
    FindAllDevicesType,
} from "../types/device.type";
import axiosClient from "./axiosConfigs";

export const deviceApi = {
    getAllDevices: async (params: GetDevicesRequestType) => {
        try {
            const response = await axiosClient.get("/api/device/all", { params });
            return response.data as FindAllDevicesType;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    addDevice: async (data: AddDeviceType) => {
        try {
            const response = await axiosClient.post("/api/device/add", data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    editDevice: async (data: EditDeviceType) => {
        try {
            const response = await axiosClient.put("/api/device/edit", data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    deleteDevices: async (data: DeleteDevicesType) => {
        try {
            const response = await axiosClient.delete("/api/device/delete", { data });
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    getOneDevice: async (params: DeviceIdType) => {
        try {
            const response = await axiosClient.get("/api/device/one", { params });
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    toggleDeviceStatus: async (data: DeviceIdType) => {
        try {
            const response = await axiosClient.put("/api/device/toggle", data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    }
};
