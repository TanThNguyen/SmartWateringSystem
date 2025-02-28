import { AxiosError } from "axios";
import { LoginType } from "../types/auth.type";
import axiosClient from "./axiosConfigs";

export const authApi = {
  login: async (params: LoginType): Promise<{
    success: boolean;
    status: number | null;
    data: any;
  }> => {
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
};
