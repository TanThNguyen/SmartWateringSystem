import React, { useEffect, useState } from "react";
import { recordAPI } from "../../axios/record.api";  // Import recordAPI
import { SensorDataResponseType } from "../../types/record.type";

const SensorDataComponent: React.FC = () => {
    const [data, setData] = useState<SensorDataResponseType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSensorData = async () => {
            try {
                // Gọi API qua recordAPI
                const response = await recordAPI.getLocationRecords({
                    locationId: "ab9fc450-0577-4934-bc31-01e088da51d9",
                    start: "2025-01-01T00:00:00Z",
                    stop: "2025-04-02T00:00:00Z",
                });
                setData(response);
            } catch (err) {
                setError("Failed to fetch data.");
            } finally {
                setLoading(false);
            }
        };

        fetchSensorData();
    }, []);

    // Hiển thị dữ liệu hoặc thông báo lỗi
    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Sensor Data</h2>
            <div>
                <h3>Moisture Records</h3>
                {data?.moisture?.map((record, index) => (
                    <div key={index}>
                        <p>Timestamp: {new Date(record.timestamp).toLocaleString()}</p>
                        <p>Soil Moisture: {record._avg.soilMoisture}</p>
                    </div>
                ))}
            </div>

            <div>
                <h3>DHT20 Records</h3>
                {data?.dht20?.map((record, index) => (
                    <div key={index}>
                        <p>Timestamp: {new Date(record.timestamp).toLocaleString()}</p>
                        <p>Temperature: {record._avg.temperature}°C</p>
                        <p>Humidity: {record._avg.humidity}%</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SensorDataComponent;
