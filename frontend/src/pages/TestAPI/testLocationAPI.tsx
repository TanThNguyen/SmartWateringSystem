import React, { useEffect, useState } from "react";
import { locationApi } from "../../axios/location.api";
import { FindAllLocationsType, InfoLocationType } from "../../types/location.type";

const LocationDataComponent: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [locations, setLocations] = useState<FindAllLocationsType | null>(null);
    useEffect(() => {
        const fetchLocationData = async () => {
            try {
                // Gọi API qua locationApi
                const response = await locationApi.getAllLocations({ search: "", order: "asc" });
                setLocations(response); // response chứa cả locations
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
                {locations?.locations?.map((location: InfoLocationType, index: number) => (
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
