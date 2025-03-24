import React, { useEffect, useState } from "react";
import { FindAllNotisType, InfoNotiType } from "../../types/notification.type";
import { notiApi } from "../../axios/notification.api";

const NotificationDataComponent: React.FC = () => {
    const [data, setData] = useState<FindAllNotisType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNotificationData = async () => {
            try {
                // Gọi API qua notiApi
                const response = await notiApi.getAllNotifications();

                // Kiểm tra nếu response và response.data tồn tại
                if (response && response.data) {
                    setData(response.data); // response chứa các notifications
                    console.log(response.data);
                } else {
                    setError("No data returned from the API.");
                }
            } catch (err) {
                setError("Failed to fetch notifications.");
            } finally {
                setLoading(false);
            }
        };

        fetchNotificationData();
    }, []);

    // Hiển thị dữ liệu hoặc thông báo lỗi
    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Notification Data</h2>
            <div>
                {data?.notifications?.map((notification: InfoNotiType, index: number) => (
                    <div key={index}>
                        <p>Notification ID: {notification.notificationId}</p>
                        <p>Sender ID: {notification.senderId}</p>
                        <p>Message: {notification.message}</p>
                        <p>Severity: {notification.severity}</p>
                        <p>Created At: {new Date(notification.createdAt).toLocaleString()}</p>
                        <p>Is Read: {notification.isRead ? "Yes" : "No"}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationDataComponent;
