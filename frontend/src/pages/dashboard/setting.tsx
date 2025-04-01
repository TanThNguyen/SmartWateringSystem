import { useEffect, useState } from "react";

import { LONG_DATE_FORMAT, TIME_FORMAT } from "../../types/date.type";
import { configurationApi } from "../../axios/configuration.api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./setting.scss";
import PopupModal from "../../layout/popupmodal";
import { locationApi } from "../../axios/location.api";
import { FindAllLocationsType } from "../../types/location.type";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FaChevronDown } from "react-icons/fa";

import { 
    ConfigurationCreateType, 
    ConfigurationUpdateType, 
    ConfigurationQueryType, 
    ConfigurationPaginatedType,
    ConfigurationDetailType,
    DeviceType,
} from "../../types/configuration.type";

const SettingPage = () => {

    const [username, setUsername] = useState("AAAA");

    const [currentTime, setCurrentTime] = useState(new Date());
    const dateString = currentTime.toLocaleDateString("vi-VN", LONG_DATE_FORMAT);
    const timeString = currentTime.toLocaleTimeString("vi-VN", TIME_FORMAT);
    const [loading, setLoading] = useState(true);

    const [searchText, setSearchText] = useState("");
    const [deviceTypeFilter, setDeviceTypeFilter] = useState<DeviceType | 'ALL'>('ALL');
    const [configurations, setConfigurations] = useState<ConfigurationPaginatedType | null>(null);
    
    const [deleteConfig, setDeleteConfig] = useState<string[]>([]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newConfig, setNewConfig] = useState<ConfigurationCreateType>({
        name: "",
        value: 0,
        locationId: "",
        deviceType: "MOISTURE_SENSOR",
    });

    const [locations, setLocations] = useState<FindAllLocationsType | null>(null);

    const [updateConfig, setUpdateConfig] = useState<ConfigurationUpdateType | null>(null);

    // ------ Phân trang -------
    const [first, setFirst] = useState<number>(0);
    const [rows, setRows] = useState<number>(10);
    // ---------------------------

    const fetchConfigurationData = async () => {
        setLoading(true);
        const request: ConfigurationQueryType = {
            page: Math.ceil(first / rows) + 1,
            items_per_page: rows,
            search: searchText,
            deviceType: deviceTypeFilter, 
        };
        try {
            const response = await configurationApi.getAllConfigurations(request);
            setConfigurations(response); 
        } catch (err) {
            toast.error("Lỗi khi tải danh sách cấu hình");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfigurations = async () => {
        try {
            const deleteRequests = deleteConfig.map((id) => ({ configId: id }));
            await Promise.all(deleteRequests.map((data) => configurationApi.deleteConfiguration(data)));
            toast.success("Xóa cấu hình thành công!");
            setDeleteConfig([]);
            fetchConfigurationData();
        } catch (error) {
            toast.error("Lỗi khi xóa cấu hình.");
        }
    };

    const handleCheckboxChange = (id: string) => {
        setDeleteConfig((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleCreateConfiguration = async () => {
        try {
            await configurationApi.createConfiguration(newConfig);
            toast.success("Tạo cấu hình thành công!");
            setShowAddForm(false);
            fetchConfigurationData(); 
        } catch (error) {
            toast.error("Lỗi khi tạo cấu hình.");
        }
    };
      
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewConfig({ ...newConfig, [e.target.name]: e.target.value });
    };
      
    const handleUpdateConfiguration = async () => {
        if (!updateConfig) return;
        try {
            await configurationApi.updateConfiguration(updateConfig);
            toast.success("Cập nhật thành công!");
            fetchConfigurationData();
            setUpdateConfig(null);
        } catch (err) {
            toast.error("Lỗi khi cập nhật!");
        }
    };

    const renderDropdown = (
        label: string,
        value: string,
        options: { label: string; value: string }[],
        onChange: (e: { value: string }) => void
    ) => (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger className="flex items-center justify-between px-3 h-10 border border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-100 w-1/5">
                <span className="truncate">
                    {options.find((option) => option.value === value)?.label || label}
                </span>
                <FaChevronDown className="ml-2 text-sm" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-white border border-gray-200 rounded-md shadow-lg py-2" sideOffset={5}>
                    {options.map((option) => (
                        <DropdownMenu.Item
                            key={option.value}
                            className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                            onSelect={() => onChange({ value: option.value })}
                        >
                            {option.label}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );

    useEffect(() => {
        const fetchLocationData = async () => {
            try {
                const response = await locationApi.getAllLocations({ search: "", order: "asc" });
                setLocations(response); 
            } catch (err) {
                toast.error("Failed to fetch locations.");
            } finally {
                setLoading(false);
            }
        };

        fetchLocationData();
    }, []);

    useEffect(() => {
        fetchConfigurationData();
    }, [deviceTypeFilter, searchText, first, rows]);

    useEffect(() => {
        const storedUser = localStorage.getItem("name");
        if (storedUser) {
            setUsername(storedUser);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (updateConfig) setUpdateConfig(null);
                if (showAddForm) setShowAddForm(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [updateConfig, showAddForm]);

    // if (loading) return <p>Loading...</p>;

    return (
        <div className="container">
            <div className="filterContainer flex items-center gap-4">
                <input
                    type="text"
                    placeholder="Tìm kiếm tên..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            fetchConfigurationData();
                        }
                    }}
                    className="px-4 text-lg h-10 border border-gray-300 rounded-md"
                />
                {renderDropdown(
                    "Tất cả thiết bị",
                    deviceTypeFilter,
                    [
                        { label: "Tất cả thiết bị", value: "ALL" },
                        { label: "MOISTURE_SENSOR", value: "MOISTURE_SENSOR" },
                        { label: "DHT20_SENSOR", value: "DHT20_SENSOR" },
                        { label: "PUMP", value: "PUMP" },
                        { label: "LCD", value: "LCD" },
                        { label: "FAN", value: "FAN" },
                        { label: "LED", value: "LED" },
                    ],
                    (e) => setDeviceTypeFilter(e.value as DeviceType | "ALL")
                )}
                <button onClick={() => setShowAddForm(true)}
                    className="bg-orange-600 text-white px-4 h-10 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
                >
                    Thêm
                </button>
                <button
                    onClick={handleDeleteConfigurations}
                    className="bg-orange-600 text-white px-4 h-10 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
                    disabled={deleteConfig.length === 0}
                >
                    Xóa
                </button>
            </div>
            
            <div className="tableContainer">
                <table className="userTable">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setDeleteConfig(configurations?.configurations?.map((item) => item.configId) || []);
                                        } else {
                                            setDeleteConfig([]);
                                        }
                                    }}
                                    checked={deleteConfig.length === configurations?.configurations?.length}
                                />
                            </th>
                            <th>Tên</th>
                            <th>Giá trị</th>
                            <th>Loại</th>
                            <th>Ngày cập nhật</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configurations?.configurations?.map((item: ConfigurationDetailType, index) => (
                            <tr key={index} onClick={() => setUpdateConfig(item)}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={deleteConfig.includes(item.configId)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={() => handleCheckboxChange(item.configId)}
                                    />
                                </td>
                                <td>{item.name}</td>
                                <td>{item.value}</td>
                                <td>{item.deviceType}</td>
                                <td>{new Date(item.lastUpdated).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Phân trang */}
            <div className="pagination flex items-center justify-center mt-4 gap-4">
                <button
                    onClick={() => setFirst(prev => Math.max(prev - rows, 0))}
                    disabled={first === 0}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                    Trước
                </button>
                <span>
                    Trang {Math.ceil(first / rows) + 1} / {configurations ? Math.ceil(configurations.total / rows) : 1}
                </span>
                <button
                    onClick={() => setFirst(prev => (configurations && (prev + rows < configurations.total) ? prev + rows : prev))}
                    disabled={configurations ? (first + rows) >= configurations.total : true}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                    Sau
                </button>
            </div>

            {updateConfig && (
                <PopupModal title="Cập nhật Cấu Hình" onClose={() => setUpdateConfig(null)}>
                    <label className="block mb-2">
                        Tên:
                        <input
                            type="text"
                            name="name"
                            value={updateConfig.name}
                            onChange={(e) => setUpdateConfig({ ...updateConfig, name: e.target.value })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </label>
                    <label className="block mb-2">
                        Giá trị:
                        <input
                            type="number"
                            name="value"
                            value={updateConfig.value}
                            onChange={(e) => setUpdateConfig({ ...updateConfig, value: Number(e.target.value) })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </label>
                    <label className="block mb-2">
                        Khu vực:
                        <select
                            name="locationId"
                            value={updateConfig.locationId}
                            onChange={(e) => setUpdateConfig({ ...updateConfig, locationId: e.target.value })}
                            className="w-full p-2 border rounded-lg"
                        >
                            {locations?.locations.map((location) => (
                                <option key={location.locationId} value={location.locationId}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block mb-2">
                        Loại thiết bị:
                        <select
                            name="deviceType"
                            value={updateConfig.deviceType}
                            onChange={(e) => setUpdateConfig({ ...updateConfig, deviceType: e.target.value as DeviceType })}
                            className="w-full p-2 border rounded-lg"
                        >
                            <option value="PUMP">PUMP</option>
                            <option value="MOISTURE_SENSOR">MOISTURE_SENSOR</option>
                            <option value="DHT20_SENSOR">DHT20_SENSOR</option>
                            <option value="LCD">LCD</option>
                            <option value="RELAY">RELAY</option>
                            <option value="FAN">FAN</option>
                        </select>
                    </label>
                    <div className="flex justify-between mt-4">
                        <button
                            onClick={handleUpdateConfiguration}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        >
                            Cập nhật
                        </button>
                        <button
                            onClick={() => setUpdateConfig(null)}
                            className="px-4 py-2 bg-gray-400 text-white rounded-lg"
                        >
                            Hủy
                        </button>
                    </div>
                </PopupModal>
            )}

            {showAddForm && (
                <PopupModal title="Thêm Cấu Hình" onClose={() => setShowAddForm(false)}>
                    <div className="space-y-4 p-4">
                        <div>
                            <label className="block text-gray-700 font-medium">Tên</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={newConfig.name} 
                                onChange={handleInputChange} 
                                className="w-full p-2 border rounded-lg "
                                placeholder="Nhập tên cấu hình"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium">Giá trị</label>
                            <input 
                                type="number" 
                                name="value" 
                                value={newConfig.value} 
                                onChange={handleInputChange} 
                                className="w-full p-2 border rounded-lg "
                                placeholder="Nhập giá trị"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium">Khu vực</label>
                            <select
                                name="locationId"
                                value={newConfig.locationId}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg "
                            >
                                {newConfig.locationId === "" && (
                                    <option value="" disabled>
                                        Chọn khu vực
                                    </option>
                                )}
                                {locations?.locations.map((location) => (
                                    <option key={location.locationId} value={location.locationId}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium">Loại thiết bị</label>
                            <select 
                                name="deviceType" 
                                value={newConfig.deviceType} 
                                onChange={handleInputChange} 
                                className="w-full p-2 border rounded-lg "
                            >
                                <option value="MOISTURE_SENSOR">MOISTURE_SENSOR</option>
                                <option value="PUMP">PUMP</option>
                                <option value="DHT20_SENSOR">DHT20_SENSOR</option>
                                <option value="LCD">LCD</option>
                                <option value="RELAY">RELAY</option>
                                <option value="FAN">FAN</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-4 mt-4">
                            <button 
                                onClick={handleCreateConfiguration} 
                                className="px-6 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition"
                            >
                                Tạo
                            </button>
                            <button 
                                onClick={() => setShowAddForm(false)} 
                                className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-600 transition"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </PopupModal>
            )}
        </div>
    );
};

export default SettingPage;