

import axiosClient from "../axios/axiosConfigs";
import { handleAPIError } from "../component/utils";
import {
  CreateSchedulePayload,
  DeleteSchedulePayload,
  FindOneScheduleParams,
  GetSchedulesParams,
  PaginatedSchedulesResponse,
  ScheduleType,
  ToggleSchedulePayload,
} from "../types/schedule.type";

const BASE_URL = "/api/schedule";

export const scheduleAPI = {

  createSchedule: async (payload: CreateSchedulePayload): Promise<ScheduleType> => {
    try {
      const response = await axiosClient.post<ScheduleType>(BASE_URL, payload);
      return response.data;
    } catch (error) {
      handleAPIError(error);
      throw error;
    }
  },

  toggleSchedule: async (payload: ToggleSchedulePayload): Promise<ScheduleType> => {
    try {

      const response = await axiosClient.put<ScheduleType>(BASE_URL, payload);
      return response.data;
    } catch (error) {
      handleAPIError(error);
      throw error;
    }
  },

  getSchedules: async (params: GetSchedulesParams): Promise<PaginatedSchedulesResponse> => {
    try {
      const response = await axiosClient.get<PaginatedSchedulesResponse>(BASE_URL, { params });
      return response.data;
    } catch (error) {
      handleAPIError(error);
      throw error;
    }
  },

  findOneSchedule: async (params: FindOneScheduleParams): Promise<ScheduleType> => {
    try {
      const response = await axiosClient.get<ScheduleType>(`${BASE_URL}/findOne`, { params });
      return response.data;
    } catch (error) {
      handleAPIError(error);
      throw error;
    }
  },

  deleteSchedule: async (payload: DeleteSchedulePayload): Promise<ScheduleType> => {
    try {

      const response = await axiosClient.delete<ScheduleType>(BASE_URL, { data: payload });
      return response.data;
    } catch (error) {
      handleAPIError(error);
      throw error;
    }
  },
};