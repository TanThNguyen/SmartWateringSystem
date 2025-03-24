import React, { useEffect, useState } from "react";
import { locationApi } from "../../axios/location.api";
import { FindAllLocationsType, InfoLocationType } from "../../types/location.type";

const LocationDataComponent: React.FC = () => {
    const [data, setData] = useState<FindAllLocationsType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLocationData = async () => {
            try {
                // Gọi API qua locationApi
                const response = await locationApi.getAllLocations({ search: "", order: "asc" });
                setData(response); // response chứa cả locations
                console.log(response);
            } catch (err) {
                setError("Failed to fetch locations.");
            } finally {
                setLoading(false);
            }
        };

        fetchLocationData();
    }, []);

    // Hiển thị dữ liệu hoặc thông báo lỗi
    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Location Data</h2>
            <div>
                {data?.locations?.map((location: InfoLocationType, index: number) => (
                    <div key={index}>
                        <p>Location ID: {location.locationId}</p>
                        <p>Name: {location.name}</p>
                        <p>Created At: {new Date(location.createdAt).toLocaleString()}</p>
                        <p>Updated At: {new Date(location.updatedAt).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LocationDataComponent;
