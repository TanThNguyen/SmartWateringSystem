import { AxiosError } from "axios";
import { ChangePasswordType, LoginType } from "../types/auth.type";
import axiosClient from "./axiosConfigs";

type ApiResponse = {
  success: boolean;
  status: number | null;
  data: any;
};

export const authApi = {
  login: async (params: LoginType): Promise<ApiResponse> => {
    try {
      const response = await axiosClient.post("/api/auth/login", params);
      return {
        success: true,
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return {
          success: false,
          status: error.response.status,
          data: error.response.data,
        };
      }
      throw new Error(`Unexpected error: ${error}`);
    }
  },


  changePassword: async (params: ChangePasswordType): Promise<ApiResponse> => {
    try {
      const response = await axiosClient.post("/api/auth/change-password", params);
      return {
        success: true,
        status: response.status, 
        data: response.data,
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return {
          success: false,
          status: error.response.status,
          data: error.response.data, 
        };
      }
      throw new Error(`Lỗi không mong muốn: ${error}`);
    }
  },
};
