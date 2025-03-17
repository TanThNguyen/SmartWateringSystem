import { AllUsersType, CreateUserType, UpdateUserType, UsersRequestType } from "../types/user.type";
import axiosClient from "./axiosConfigs";
import environment from "../environment";

export const userApi = {
    getAllUsers: async (params: UsersRequestType): Promise<AllUsersType> => {
        try {
            const response = await axiosClient.get<AllUsersType>("/api/user/all", { params });
            console.log("getAllUsers", response.data);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    createUser: async (userData: CreateUserType): Promise<string> => {
        try {
            const response = await axiosClient.post<string>("/api/user/create", userData);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    updateUser: async (userData: UpdateUserType): Promise<string> => {
        try {
            const response = await axiosClient.put<string>("/api/user/edit", userData);
            return response.data;
        } catch (error) {
            handleAPIError(error);
            throw error;
        }
    },

    deleteUsers: async (userIds: string[]): Promise<string> => {
        try {
            const response = await axiosClient.delete<string>("/api/user/delete", {
                data: { userIds },
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