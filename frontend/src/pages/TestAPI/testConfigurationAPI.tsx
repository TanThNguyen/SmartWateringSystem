import React, { useEffect, useState } from "react";
import { configurationApi } from "../../axios/configuration.api";
import { ConfigurationPaginatedType, ConfigurationDetailType } from "../../types/configuration.type";

const ConfigurationDataComponent: React.FC = () => {
    const [data, setData] = useState<ConfigurationPaginatedType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfigurationData = async () => {
            try {
                // Gọi API qua configurationApi
                const response = await configurationApi.getAllConfigurations({
                    page: 1,
                    items_per_page: 10,
                    search: "",
                    deviceType: "ALL",  // Có thể thay đổi hoặc lọc theo deviceType
                });
                setData(response); // response chứa cả configurations
                console.log(response);
            } catch (err) {
                setError("Failed to fetch configurations.");
            } finally {
                setLoading(false);
            }
        };

        fetchConfigurationData();
    }, []);

    // Hiển thị dữ liệu hoặc thông báo lỗi
    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Configuration Data</h2>
            <div>
                {data?.configurations?.map((config: ConfigurationDetailType, index: number) => (
                    <div key={index}>
                        <p>Configuration ID: {config.configId}</p>
                        <p>Name: {config.name}</p>
                        <p>Value: {config.value}</p>
                        <p>Location ID: {config.locationId}</p>
                        <p>Device Type: {config.deviceType}</p>
                        <p>Last Updated: {new Date(config.lastUpdated).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConfigurationDataComponent;
