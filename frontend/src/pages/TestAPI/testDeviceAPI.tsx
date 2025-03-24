import React, { useEffect, useState } from "react";
import { deviceApi } from "../../axios/device.api";
import { FindAllDevicesType, InfoDevicesType } from "../../types/device.type"; // Loại dữ liệu từ device.type

const DeviceDataComponent: React.FC = () => {
    const [data, setData] = useState<FindAllDevicesType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDeviceData = async () => {
            try {
                // Gọi API qua deviceApi để lấy danh sách thiết bị
                const response = await deviceApi.getAllDevices({
                    page: 1,
                    items_per_page: 10,
                    search: "",
                    status: "ALL",
                    order: "asc"
                });
                setData(response); // response chứa danh sách thiết bị
                console.log(response);
            } catch (err) {

                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to fetch devices.");
                }

                setError("Failed to fetch devices.");

            } finally {
                setLoading(false);
            }
        };

        fetchDeviceData();
    }, []);

    // Hiển thị dữ liệu hoặc thông báo lỗi
    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Device Data</h2>
            <div>
                {data?.devices?.map((device: InfoDevicesType) => (
                    <div key={device.deviceId}>
                {data?.devices?.map((device: InfoDevicesType, index: number) => (
                    <div key={index}>
                        <p>Device ID: {device.deviceId}</p>
                        <p>Name: {device.name}</p>
                        <p>Location: {device.locationName}</p>
                        <p>Status: {device.status}</p>
                        <p>Updated At: {new Date(device.updatedAt).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeviceDataComponent;
