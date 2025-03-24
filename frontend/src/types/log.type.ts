export enum Severity {
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR"
}

export type InfoLogType = {
    logId: string;
    userId: string;
    deviceId: string;
    eventType: Severity;
    description: string;
    createdAt: Date;
};

export type FindAllLogsType = {
    logs: InfoLogType[];
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    lastPage: number;
};

export type GetLogsRequestType = {
    page: number;
    items_per_page: number;
    search?: string;
    eventType?: Severity | "ALL";
    order?: string; // 'asc' or 'desc'
};
