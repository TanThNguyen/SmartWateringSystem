
export type ScheduleType = {
    scheduleId: string;
    deviceId: string;
    startTime: string; 
    endTime: string;   
    repeatDays: number; // Bitmask (0-127)
    isActive: boolean;
    device?: { 
        name: string;
    };
};


export type CreateSchedulePayload = {
    deviceId: string;
    startTime: string; 
    endTime: string;  
    repeatDays: number;
    isActive?: boolean;
};


export type GetSchedulesParams = {
    deviceId?: string;
    isActive?: boolean | 'ALL'; 
    page?: number;
    items_per_page?: number;
};


export type PaginatedSchedulesResponse = {
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    lastPage: number;
    schedules: ScheduleType[]; 
};


export type ToggleSchedulePayload = {
    scheduleId: string;
};

export type FindOneScheduleParams = {
    scheduleId: string;
};

export type DeleteSchedulePayload = {
    scheduleId: string;
};