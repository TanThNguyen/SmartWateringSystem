// src/api/schedule.api.ts

import axiosClient from "../axios/axiosConfigs"; // Adjust the path as needed
import { handleAPIError } from "../component/utils"; // Adjust the path as needed
import {
  CreateSchedulePayload,
  DeleteSchedulePayload,
  FindOneScheduleParams,
  GetSchedulesParams,
  PaginatedSchedulesResponse,
  ScheduleType,
  ToggleSchedulePayload,
} from "../types/schedule.type"; // Adjust the path as needed

const BASE_URL = "/api/schedule"; // Base URL for schedule endpoints

export const scheduleAPI = {
  /**
   * Creates a new schedule.
   * Corresponds to POST /api/schedule
   */
  createSchedule: async (payload: CreateSchedulePayload): Promise<ScheduleType> => {
    try {
      const response = await axiosClient.post<ScheduleType>(BASE_URL, payload);
      console.log("createSchedule response:", response.data);
      return response.data;
    } catch (error) {
      handleAPIError(error);
      throw error; // Re-throw after handling
    }
  },

  /**
   * Toggles the isActive status of a schedule.
   * Corresponds to PUT /api/schedule
   */
  toggleSchedule: async (payload: ToggleSchedulePayload): Promise<ScheduleType> => {
    try {
      // PUT request often sends data in the body
      const response = await axiosClient.put<ScheduleType>(BASE_URL, payload);
      console.log("toggleSchedule response:", response.data);
      return response.data;
    } catch (error) {
      handleAPIError(error);
      throw error;
    }
  },

  /**
   * Fetches a paginated list of schedules based on query parameters.
   * Corresponds to GET /api/schedule
   */
  getSchedules: async (params: GetSchedulesParams): Promise<PaginatedSchedulesResponse> => {
    try {
      const response = await axiosClient.get<PaginatedSchedulesResponse>(BASE_URL, { params });
      console.log("getSchedules response:", response.data);
      return response.data;
    } catch (error) {
      handleAPIError(error);
      throw error;
    }
  },

  /**
   * Fetches a single schedule by its ID.
   * Corresponds to GET /api/schedule/findOne
   */
  findOneSchedule: async (params: FindOneScheduleParams): Promise<ScheduleType> => {
    try {
      const response = await axiosClient.get<ScheduleType>(`${BASE_URL}/findOne`, { params });
      console.log("findOneSchedule response:", response.data);
      return response.data; // Backend returns the full Schedule object
    } catch (error) {
      handleAPIError(error);
      throw error;
    }
  },

  /**
   * Deletes a schedule by its ID.
   * Corresponds to DELETE /api/schedule
   */
  deleteSchedule: async (payload: DeleteSchedulePayload): Promise<ScheduleType> => {
    try {
      // DELETE requests can have a body, specified using the `data` option in axios config
      const response = await axiosClient.delete<ScheduleType>(BASE_URL, { data: payload });
      console.log("deleteSchedule response:", response.data);
      return response.data; // Returns the deleted schedule data
    } catch (error) {
      handleAPIError(error);
      throw error;
    }
  },

  /**
   * Triggers the backend to immediately check schedules and apply status updates.
   * Corresponds to POST /api/schedule/check-now
   */
//   triggerCheckNow: async (): Promise<void> => {
//     try {
//       // Expecting a 204 No Content response, so no specific data type needed
//       await axiosClient.post(`${BASE_URL}/check-now`);
//       console.log("triggerCheckNow successful (expected 204 No Content)");
//       // No return value needed for void
//     } catch (error) {
//       handleAPIError(error);
//       throw error;
//     }
//   },
};