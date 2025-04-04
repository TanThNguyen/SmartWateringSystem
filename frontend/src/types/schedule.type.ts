// src/types/schedule.type.ts

/**
 * Represents the structure of a single schedule object,
 * typically returned by the API or used within lists.
 * Dates are represented as ISO strings as they come from JSON.
 */
export type ScheduleType = {
    scheduleId: string;
    deviceId: string;
    startTime: string; // ISO Date String (e.g., "2023-10-27T10:00:00.000Z")
    endTime: string;   // ISO Date String (e.g., "2023-10-27T18:30:00.000Z")
    repeatDays: number; // Bitmask (0-127)
    isActive: boolean;
    device?: { // Optional device info, included in some responses like toggle/delete/findOne
        name: string;
    };
};

/**
 * Payload required for creating a new schedule.
 * Matches the backend CreateScheduleDto.
 */
export type CreateSchedulePayload = {
    deviceId: string;
    startTime: string; // ISO Date String
    endTime: string;   // ISO Date String
    repeatDays: number;
    isActive?: boolean; // Optional, defaults to true on backend
};

/**
 * Query parameters for fetching a list of schedules.
 * Matches the backend GetSchedulesRequestDto.
 */
export type GetSchedulesParams = {
    deviceId?: string;
    isActive?: boolean | 'ALL'; // 'ALL' means don't filter by isActive
    page?: number;
    items_per_page?: number;
};

/**
 * Structure of the response when fetching a paginated list of schedules.
 * Matches the backend FindAllSchedulesDto.
 */
export type PaginatedSchedulesResponse = {
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    lastPage: number;
    schedules: ScheduleType[]; // Array of schedule objects
};

/**
 * Payload for toggling the isActive status of a schedule.
 */
export type ToggleSchedulePayload = {
    scheduleId: string;
};

/**
 * Query parameters for fetching a single schedule by its ID.
 */
export type FindOneScheduleParams = {
    scheduleId: string;
};

/**
 * Payload for deleting a schedule.
 */
export type DeleteSchedulePayload = {
    scheduleId: string;
};