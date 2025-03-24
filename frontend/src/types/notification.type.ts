// Định nghĩa type cho Severity (không phụ thuộc Prisma)
export type Severity = "INFO" | "WARNING" | "ERROR";

// Định nghĩa type cho InfoNotiDto
export type InfoNotiType = {
    notificationId: string;
    senderId: string;
    message: string;
    severity: Severity;
    isRead: boolean;
    createdAt: Date;
};

// Định nghĩa type cho FindAllNotisDto
export type FindAllNotisType = {
    notifications: InfoNotiType[];
};

// Định nghĩa type cho OneNotiRequestDto
export type OneNotiRequestType = {
    notificationId: string;
};
