import { useEffect, useState } from "react";

import { LONG_DATE_FORMAT, TIME_FORMAT } from "../../types/date.type";
import { configurationApi } from "../../axios/configuration.api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./setting.scss"; import PopupModal from "../../layout/popupmodal";
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
    const [first, setFirst] = useState<number>(0);
    const [rows, setRows] = useState<number>(10);
    const [isAdmin, setIsAdmin] = useState(true);





    const fetchConfigurationData = async () => {
        setLoading(true);
        const request: ConfigurationQueryType = {
            page: Math.ceil(first / rows) + 1,
            items_per_page: rows,
            search: searchText,
            deviceType: deviceTypeFilter === 'ALL' ? undefined : deviceTypeFilter,
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
        value: string, options: { label: string; value: string }[],
        onChange: (e: { value: string }) => void
    ) => (
        <div className="filterDropdownWrapper">
            <DropdownMenu.Root>
                {/* Apply SCSS class to Trigger */}
                <DropdownMenu.Trigger className="filterDropdownTrigger">
                    <span /* No class needed based on SCSS, keep original structure */>
                        {options.find((option) => option.value === value)?.label || label}
                    </span>
                    {/* Apply SCSS class to Chevron */}
                    <FaChevronDown className="filterDropdownChevron" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    {/* Apply SCSS class to Content */}
                    <DropdownMenu.Content className="filterDropdownContent" sideOffset={5}>
                        {options.map((option) => (
                            <DropdownMenu.Item
                                key={option.value}
                                className="filterDropdownItem"
                                onSelect={() => onChange({ value: option.value })}
                            >
                                {option.label}
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
    );


    useEffect(() => {
        const role = localStorage.getItem("role");
        if (role === "ADMIN") {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    }, []);
    useEffect(() => {
        const fetchLocationData = async () => {
            try {
                const response = await locationApi.getAllLocations({ search: "", order: "asc" });
                setLocations(response);
            } catch (err) {
                toast.error("Failed to fetch locations.");
            } finally {
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

    return (
        <div className="container">
            {/* Filter Section - Apply SCSS class, remove original layout classes */}
            <div className="filterContainer">
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
                    className="searchInput"
                />
                {/* Keep the original call structure for renderDropdown */}
                {renderDropdown(
                    "Tất cả thiết bị",
                    deviceTypeFilter, [
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
                {/* <button onClick={() => setShowAddForm(true)}
                                        className="actionButton"
                >
                    Thêm
                </button>
                <button
                    onClick={handleDeleteConfigurations}
                                        className="actionButton"
                    disabled={deleteConfig.length === 0}                 >
                    Xóa
                </button> */}

                {isAdmin && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="button addButton"
                    >
                        Thêm Mới
                    </button>)}

                {isAdmin && (
                    <button
                        onClick={handleDeleteConfigurations}
                        disabled={deleteConfig.length === 0 || loading}
                        className="button deleteButton"
                    >
                        Xóa ({deleteConfig.length})
                    </button>

                )}


            </div>

            {/* Table Section - Apply SCSS class to container */}
            {/* No tableWrapper added this time to strictly follow "no additions" */}
            <div className="tableContainer">
                {/* Apply SCSS class to table, rename from userTable */}
                <table className="configTable">
                    <thead>
                        <tr>
                            {/* Apply SCSS class to checkbox header cell */}
                            <th className="checkboxCell">
                                <input
                                    type="checkbox"
                                    className="checkboxInput"
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
                            {/* Keep original columns */}
                            <th>Ngày cập nhật</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Keep original mapping logic (with potential TS warning) */}
                        {configurations?.configurations?.map((item: ConfigurationDetailType, index) => (
                            <tr key={index} onClick={() => setUpdateConfig(item as ConfigurationUpdateType)}>
                                {/* Apply SCSS class to checkbox data cell */}
                                <td className="checkboxCell">
                                    <input
                                        type="checkbox"
                                        className="checkboxInput"
                                        checked={deleteConfig.includes(item.configId)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={() => handleCheckboxChange(item.configId)}
                                    />
                                </td>
                                <td>{item.name}</td>
                                <td>{item.value}</td>
                                <td>{item.deviceType}</td>
                                {/* Keep original columns */}
                                <td>{new Date(item.lastUpdated).toLocaleString()}</td>
                            </tr>
                        ))}
                        {/* Add original no results logic if it existed */}
                        {(!configurations?.configurations || configurations.configurations.length === 0) && !loading && (
                            <tr>
                                <td colSpan={5} className="noResults"> {/* Assuming 5 columns originally */}
                                    Không tìm thấy kết quả
                                </td>
                            </tr>
                        )}
                        {/* Add original loading logic if it existed */}
                        {loading && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}> {/* Assuming 5 columns originally */}
                                    Đang tải...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Section - Apply SCSS class, remove original layout classes */}
            <div className="paginationContainer">
                <button
                    onClick={() => setFirst(prev => Math.max(prev - rows, 0))}
                    disabled={first === 0} className="paginationButton"
                >
                    Trước
                </button>
                {/* Apply SCSS class to pagination info */}
                <span className="paginationInfo">
                    {/* Keep original text structure */}
                    Trang {Math.ceil(first / rows) + 1} / {configurations ? Math.ceil(configurations.total / rows) : 1}
                </span>
                <button
                    onClick={() => setFirst(prev => (configurations && (prev + rows < configurations.total) ? prev + rows : prev))}
                    disabled={configurations ? (first + rows) >= configurations.total : true}
                    className="paginationButton"
                >
                    Sau
                </button>
            </div>

            {/* Update Modal - Keep original conditional rendering */}
            {updateConfig && (
                <PopupModal title="Cập nhật Cấu Hình" onClose={() => setUpdateConfig(null)}>
                    {/* Apply SCSS class to content area */}
                    <div className="modalContent">
                        {/* Keep original label/input structure, remove original classes */}
                        <label>
                            Tên:
                            <input
                                type="text"
                                name="name"
                                value={updateConfig.name}
                                onChange={(e) => setUpdateConfig({ ...updateConfig, name: e.target.value })}
                            />
                        </label>
                        <label>
                            Giá trị:
                            <input
                                type="number"
                                name="value"
                                value={updateConfig.value}
                                onChange={(e) => setUpdateConfig({ ...updateConfig, value: Number(e.target.value) })}
                            />
                        </label>
                        <label>
                            Khu vực:
                            <select
                                name="locationId"
                                value={updateConfig.locationId}
                                onChange={(e) => setUpdateConfig({ ...updateConfig, locationId: e.target.value })}
                            >
                                {locations?.locations.map((location) => (
                                    <option key={location.locationId} value={location.locationId}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Loại thiết bị:
                            <select
                                name="deviceType"
                                value={updateConfig.deviceType}
                                onChange={(e) => setUpdateConfig({ ...updateConfig, deviceType: e.target.value as DeviceType })}
                            >
                                <option value="PUMP">PUMP</option>
                                <option value="MOISTURE_SENSOR">MOISTURE_SENSOR</option>
                                <option value="DHT20_SENSOR">DHT20_SENSOR</option>
                                <option value="LCD">LCD</option>
                                {/* Add RELAY if it was in the original options */}
                                {/* <option value="RELAY">RELAY</option> */}
                                <option value="FAN">FAN</option>
                                {/* Add LED if it was in the original options */}
                                {/* <option value="LED">LED</option> */}
                            </select>
                        </label>
                    </div>
                    {/* Apply SCSS class to actions area */}
                    <div className="modalActions">
                        {/* Keep original button structure, apply SCSS classes */}
                        <button
                            onClick={handleUpdateConfiguration}
                            className="modalButton primary"                         >
                            Cập nhật
                        </button>
                        <button
                            onClick={() => setUpdateConfig(null)}
                            className="modalButton secondary"                         >
                            Hủy
                        </button>
                    </div>
                </PopupModal>
            )}

            {/* Add Modal - Keep original conditional rendering */}
            {showAddForm && (
                <PopupModal title="Thêm Cấu Hình" onClose={() => setShowAddForm(false)}>
                    {/* Apply SCSS class to content area */}
                    {/* Note: Original had extra wrapping divs, keeping that structure */}
                    <div className="modalContent">
                        {/* Keep original structure within modalContent */}
                        <div>
                            <label>Tên</label>
                            <input
                                type="text"
                                name="name"
                                value={newConfig.name}
                                onChange={handleInputChange}
                                placeholder="Nhập tên cấu hình"
                            />
                        </div>
                        <div>
                            <label>Giá trị</label>
                            <input
                                type="number"
                                name="value"
                                value={newConfig.value}
                                onChange={handleInputChange}
                                placeholder="Nhập giá trị"
                            />
                        </div>
                        <div>
                            <label>Khu vực</label>
                            <select
                                name="locationId"
                                value={newConfig.locationId}
                                onChange={handleInputChange}
                            >
                                {/* Keep original logic for default option */}
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
                            <label>Loại thiết bị</label>
                            <select
                                name="deviceType"
                                value={newConfig.deviceType}
                                onChange={handleInputChange}
                            >
                                <option value="MOISTURE_SENSOR">MOISTURE_SENSOR</option>
                                <option value="PUMP">PUMP</option>
                                <option value="DHT20_SENSOR">DHT20_SENSOR</option>
                                <option value="LCD">LCD</option>
                                {/* Add RELAY if it was in the original options */}
                                {/* <option value="RELAY">RELAY</option> */}
                                <option value="FAN">FAN</option>
                                {/* Add LED if it was in the original options */}
                                {/* <option value="LED">LED</option> */}
                            </select>
                        </div>
                    </div>
                    {/* Apply SCSS class to actions area */}
                    <div className="modalActions">
                        {/* Keep original button structure, apply SCSS classes */}
                        <button
                            onClick={handleCreateConfiguration}
                            className="modalButton success"                         >
                            Tạo mới
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="modalButton secondary"                         >
                            Hủy
                        </button>
                    </div>
                </PopupModal>
            )}
        </div>
    );
};

export default SettingPage;