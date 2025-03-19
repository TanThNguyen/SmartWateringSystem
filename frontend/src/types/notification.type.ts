export type GetNotisDataType = {
data: {
    notifications: {
        notificationId: string;
        senderId: string;
        message: string;
        severity: 'INFO' | 'WARNING' | 'ERROR' ;
        isRead: boolean;
        createdAt: Date;
    }[];
}
}

