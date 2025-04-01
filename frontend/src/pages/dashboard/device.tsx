import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FaChevronDown } from "react-icons/fa";

import PopupModal from "../../layout/popupmodal";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { deviceApi } from "../../axios/device.api";
import { recordAPI } from "../../axios/record.api";
import { configurationApi } from "../../axios/configuration.api";
import { locationApi } from "../../axios/location.api";



import { 
  DeviceStatus, 
  DeviceType, 
  InfoDevicesType, 
  GetDevicesRequestType, 
  EditDeviceType, 
  AddDeviceType, 
  DeviceIdType} 
  from "../../types/device.type";
import {  SensorDataRequestType } from "../../types/record.type";
import { FindAllLocationsType } from "../../types/location.type";
import { 
  ConfigurationFilterType,
  ConfigurationDetailType 
} from "../../types/configuration.type";



import "./device.scss";



export default function UserManagementPage() {
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [searchText, setSearchText] = useState("");
  const [locationIdFilter, setLocationIdFilter] = useState("");
  const [devices, setDevices] = useState<InfoDevicesType[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const [showEditForm, setShowEditForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedDevice, setSelectedDevice] = useState<string[]>([]);
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<InfoDevicesType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [temperatureChartData, setTemperatureChartData] = useState<Array<{ time: number, temp: number }>>([]);
  const [humidityChartData, setHumidityChartData] = useState<Array<{ time: number, humidity: number }>>([]);
  const [soilChartData, setSoilChartData] = useState<Array<{ time: number, soil: number }>>([]);


  const [configType, setConfigType] = useState<{ configurations: ConfigurationDetailType[] } | null>(null);


  const [locations, setLocations] = useState<FindAllLocationsType | null>(null);
  const [newDevice, setNewDevice] = useState<AddDeviceType>({
    name: "",
    locationID: "",
    type: DeviceType.MOISTURE_SENSOR,
    status: DeviceStatus.ACTIVE,
    thresholdId: "",
    tempMinId: "",
    tempMaxId: "",
    humidityThresholdId: "",
    speed: "",
  });

  const [editDeviceData, setEditDeviceData] = useState<EditDeviceType>({
    deviceId: "",
    name: "",
    status: undefined,
    locationId: "",
  });
  const infoModalRef = useRef<HTMLDivElement>(null);




  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEditForm(false);
      }
    };
    if (showEditForm) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showEditForm]);
useEffect(() => {
  if (selectedDeviceInfo) {
    setEditDeviceData({
      deviceId: selectedDeviceInfo.deviceId,
      name: selectedDeviceInfo.name,
      status: selectedDeviceInfo.status,
    });
  }
}, [selectedDeviceInfo]);
  const fetchDevice = async () => {
    setLoading(true);
    const validStatus: DeviceStatus | 'ALL' | undefined =
      statusFilter === "All" ? "ALL" : (statusFilter as DeviceStatus);
    const request: GetDevicesRequestType = {
      page: Math.ceil(first / rows) + 1,
      items_per_page: rows,
      search: searchText.trim(),
      status: validStatus,
      locationName: locationIdFilter,
      order,
    };
    try {
      const response = await deviceApi.getAllDevices(request);
      setDevices(response.devices);
      setTotalRecords(response.total);
      setFirst((response.currentPage - 1) * rows);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceData = async (selectedDevice: string) => {
    try {
      const params: SensorDataRequestType = {
        deviceId: selectedDevice,
        start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        stop: new Date().toISOString(),
      };

      const response = await recordAPI.getDeviceRecords(params);
      if (!response || response.length === 0) return;

      if (selectedDeviceInfo?.type === DeviceType.MOISTURE_SENSOR) {
        const newSoilChartData = response.map((record: { timestamp: string; soilMoisture: number }) => ({
          time: new Date(record.timestamp).getTime(),
          soil: record.soilMoisture ?? 0,
        }));

        setSoilChartData(newSoilChartData);
      } else if (selectedDeviceInfo?.type === DeviceType.DHT20_SENSOR) {
        const newTemperatureChartData = response.map((record: { timestamp: string; temperature: number }) => ({
          time: new Date(record.timestamp).getTime(),
          temp: record.temperature ?? 0,
        }));

        const newHumidityChartData = response.map((record: { timestamp: string; humidity: number }) => ({
          time: new Date(record.timestamp).getTime(),
          humidity: record.humidity ?? 0,
        }));

        setTemperatureChartData(newTemperatureChartData);
        setHumidityChartData(newHumidityChartData);
      }
    } catch (error) {
      console.error("Error fetching device data:", error);
    }
  };


  const fetchConfig = async () => {
    if (!newDevice.locationID || !newDevice.type) return;
    try {
      const params: ConfigurationFilterType = {
        locationId: newDevice.locationID,
        deviceType: newDevice.type,
      };
      const data = await configurationApi.getConfigurationsByFilter(params);
  
      if (data && Array.isArray(data.configurations)) {
        setConfigType(data.configurations); // Lưu trực tiếp mảng
      } else {
        console.error("API trả về không đúng định dạng:", data);
        // setConfigType([]);
      }
    } catch (error) {
      console.error("Lỗi khi fetch config:", error);
      // setConfigType([]);
    }
  };
  
  

  useEffect(() => {
    fetchConfig();
  }, [newDevice.locationID, newDevice.type]); 
  
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
    fetchDevice();
  }, [first, rows, statusFilter, order, locationIdFilter]);

  useEffect(() => {
    if (!selectedDeviceInfo?.deviceId ||
      !(selectedDeviceInfo.type === DeviceType.MOISTURE_SENSOR || selectedDeviceInfo.type === DeviceType.DHT20_SENSOR)) {
      return;
    }

    fetchDeviceData(selectedDeviceInfo.deviceId);

    const intervalId = setInterval(() => {
      fetchDeviceData(selectedDeviceInfo.deviceId);
    }, 300000);

    return () => clearInterval(intervalId);
  }, [selectedDeviceInfo]);

  const filteredDevices = devices.filter((device) => {
    const inSearch =
      device.name.toLowerCase().includes(searchText.toLowerCase()) ||
      device.locationName.toLowerCase().includes(searchText.toLowerCase());

    if (!inSearch) return false;

    return DeviceStatus.ACTIVE;
  });

  const handleNewDeviceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewDevice({ ...newDevice, [e.target.name]: e.target.value });
  };
  const handleEditDevice = async () => {
    try {
      await deviceApi.editDevice(editDeviceData);
      toast.success("Cập nhật thiết bị thành công!");
      fetchDevice(); 
      setShowEditForm(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật thiết bị:", error);
      toast.error("Lỗi khi cập nhật thiết bị");
    }
  };
  
  const handleCreateDevice = async () => {
    try {
      await deviceApi.addDevice(newDevice);
      fetchDevice();
      setShowAddForm(false);

      toast.success("Thiết bị được tạo thành công!");
    } catch (error) {
      console.error("Lỗi khi tạo thiết bị:", error);
      toast.error("Lỗi khi tạo thiết bị");
    }
  };

  const handleDeleteDevice = async () => {
    if (selectedDevice.length === 0) return;
    try {
      await deviceApi.deleteDevices({ deviceIds: selectedDevice });
      setSelectedDevice([]);
      fetchDevice();
    } catch (error) {
      console.error("Lỗi khi xóa thiết bị:", error);
    }
  };



  // đã gọi API, lỗi nội bộ....
  const handleToggleDeviceStatus = async (deviceId: string) => {
    const data: DeviceIdType = { deviceId };  
    try {
        const result = await deviceApi.toggleDeviceStatus(data);  
        console.log("Thành công!" , result);
    } catch (error) {
        console.error("Lỗi chuyển chế độ:", error);
    }
};




  const toggleSelectDevice = (userId: string) => {
    setSelectedDevice((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleOpenInfoForm = (device: InfoDevicesType) => {
    setSelectedDeviceInfo(device);
    setShowEditForm(true);
  };

  const renderDropdown = (
    label: string,
    value: string,
    options: { label: string; value: string }[],
    onChange: (e: { value: string }) => void
  ) => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center justify-between px-3 h-10 border border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-100 w-80">
        <span className="truncate">
          {options.find((option) => option.value === value)?.label || label}
        </span>
        <FaChevronDown className="ml-2 text-sm" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-white border border-gray-200 rounded-md shadow-lg py-2"
          sideOffset={5}
        >
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



  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <div className="filterContainer flex items-center gap-4">
        <input
          type="text"
          placeholder="Tìm kiếm (tên, khu vực)"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
                fetchDevice();
            }
        }}
          className="px-4 text-lg h-10 border border-gray-300 rounded-md"
        />

        {renderDropdown(
          "Trạng thái",
          statusFilter,
          [
            { label: "Tất cả thiết bị", value: "All" },
            { label: "Hoạt động", value: DeviceStatus.ACTIVE },
            { label: "Không hoạt động", value: DeviceStatus.INACTIVE },
          ],
          (e) => setStatusFilter(e.value)
        )}

        {renderDropdown(
          "Sắp xếp",
          order,
          [
            { label: "Mới nhất", value: "desc" },
            { label: "Lâu nhất", value: "asc" },
          ],
          (e) => setOrder(e.value)
        )} 

        {renderDropdown(
          "Khu vực",
          locationIdFilter,
          [
            { label: "Khu vực", value: "ALL" },
            { label: "Khu vực 1", value: "KV1" },
            { label: "Khu vực 2", value: "KV2" },         
          ],
          (e) => setLocationIdFilter(e.value),
        )}

        <button onClick={() => setShowAddForm(true)}
          className="bg-orange-600 text-white px-4 h-10 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
        >
          Thêm
        </button>
        <button onClick={handleDeleteDevice} disabled={selectedDevice.length === 0}
          className="bg-orange-600 text-white px-4 h-10 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
        >Xóa</button>
      </div>

      
      <div className="tableContainer" >
        <table className="userTable">
          <thead>
            <tr>
              <th>  </th>
              <th>Tên</th>
              <th>Địa điểm</th>
              <th>Loại</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length > 0 ? (
              filteredDevices.map((device, index) => (
                <tr key={index} onClick={() => handleOpenInfoForm(device)}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedDevice.includes(device.deviceId)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelectDevice(device.deviceId)}
                      className="w-5 h-5"
                    />
                  </td>
                  <td>
                    {device.name}
                  </td>
                  <td>{device.locationName}</td>
                  <td>{device.type}</td>
                  <td 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDeviceStatus(device.deviceId);
                    }}
                  >
                    {device.status}
                  </td>               
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="noResults">
                  Không tìm thấy thiết bị phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div> {/* End of tableContainer */}
      
      {/* Added Pagination */}
      <div className="pagination flex items-center justify-center mt-4 gap-4">
        <button 
          onClick={() => setFirst(prev => Math.max(prev - rows, 0))} 
          disabled={first === 0}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Trước
        </button>
        <span>
          Trang {Math.ceil(first/rows) + 1} / {Math.ceil(totalRecords/rows)}
        </span>
        <button 
          onClick={() => setFirst(prev => (prev + rows < totalRecords ? prev + rows : prev))} 
          disabled={first + rows >= totalRecords}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Sau
        </button>
      </div>
      
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div ref={infoModalRef} onClick={(e) => e.stopPropagation()}>
        <PopupModal title="Thêm thiết bị" onClose={() => setShowAddForm(false)}>
          <label>
            Tên:
            <input
              type="text"
              name="name"
              value={newDevice.name}
              onChange={handleNewDeviceChange}
            />
          </label>




          <label>
            Loại:
            <select
              name="type"
              value={newDevice.type}
              onChange={handleNewDeviceChange}
            >
              <option value="PUMP">PUMP</option>
              <option value="MOISTURE_SENSOR">MOISTURE_SENSOR</option>
              <option value="DHT20_SENSOR">DHT20_SENSOR</option>
              <option value="LCD">LCD</option>
              <option value="RELAY">RELAY</option>
              <option value="FAN">FAN</option>
            </select>
          </label>

          <label>
            Khu vực
            <select
              name="locationID"
              value={newDevice.locationID}
              onChange={handleNewDeviceChange }
              className="w-full p-2 border rounded-lg "
            >
              {newDevice.locationID === "" && (
                <option value="" disabled>
                  Chọn khu vực
                </option>
              )}
              {locations?.locations.map((location) => (
                <option key={location.locationId } value={location.locationId } >
                    
                  {location.name}
                </option>
              ))}
              
            </select>
            
          </label> 

          {newDevice.type === "MOISTURE_SENSOR" && newDevice.locationID && (
            <label>
              Chọn cấu hình:
              <select
                name="thresholdId"
                value={newDevice.thresholdId}
                onChange={handleNewDeviceChange}
                className="w-full p-2 border rounded-lg"
              >
                {newDevice.thresholdId === "" && (
                  <option value="" disabled>
                    Chọn cấu hình
                  </option>
                )}
                {Array.isArray(configType) &&
                  configType.map((config) => (
                    <option key={config.configId} value={config.configId}>
                      {config.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {newDevice.type === "DHT20_SENSOR" && newDevice.locationID &&(
            
            <label>
            Chọn cấu hình:
            <select
              name="tempMinId"
              value={newDevice.tempMinId} 
              onChange={(e) => {
                const selectedValue = e.target.value;
                setNewDevice((prev) => ({
                  ...prev,
                  tempMinId: selectedValue,
                  tempMaxId: selectedValue,
                  humidityThresholdId: selectedValue,
                }));
              }}
              className="w-full p-2 border rounded-lg"
            >
              {newDevice.tempMinId === "" && (
                <option value="" disabled>
                  Chọn cấu hình
                </option>
              )}
              {Array.isArray(configType) &&
                configType.map((config) => (
                  <option key={config.configId} value={config.configId}>
                    {config.name}
                  </option>
                ))}
            </select>
          </label>
        
          
          )}



          <div className="flex justify-between mt-4 w-full">
            <button onClick={handleCreateDevice}
              className="px-6 py-2 border-2 border-orange-500 text-orange-500 font-bold rounded-lg shadow-lg hover:bg-orange-500 hover:text-white transition-all duration-200"
            >Tạo</button>

            <button onClick={() => setShowAddForm(false)}
              className="px-6 py-2 border-2 border-orange-500 text-orange-500 font-bold rounded-lg shadow-lg hover:bg-orange-500 hover:text-white transition-all duration-200"
            >Hủy</button>
          </div>
        </PopupModal>
        </div>
      </div>
      )}



      {showEditForm && selectedDeviceInfo && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div ref={infoModalRef} onClick={(e) => e.stopPropagation()}>
            <PopupModal title="Thông tin thiết bị" onClose={() => setShowEditForm(false)}>
              <div className="p-4 bg-white/80 rounded-lg shadow-md" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                <label>
                  Tên thiết bị:
                  <input
                    type="text"
                    name="name"
                    value={editDeviceData.name || ""}
                    onChange={(e) => setEditDeviceData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </label>

                <label>
                  Trạng thái:
                  <select
                    name="status"
                    value={editDeviceData.status || ""}
                    onChange={(e) => setEditDeviceData((prev) => ({ ...prev, status: e.target.value as DeviceStatus }))}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </label>

                <label>
                  Khu vực:
                  <select
                    name="locationId"
                    value={editDeviceData.locationId || ""}
                    onChange={(e) => setEditDeviceData((prev) => ({ ...prev, locationId: e.target.value }))}
                  >
                    {locations?.locations.map((location) => (
                      <option key={location.locationId} value={location.locationId}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </label>



                {selectedDeviceInfo?.type === DeviceType.MOISTURE_SENSOR && (
                  <div className="bg-white/80 rounded-lg p-4">
                    <div className="text-lg font-semibold mb-2">Soil Moisture</div>

                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={soilChartData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="time"
                          tickFormatter={(time) =>
                            new Date(time).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          }
                          interval="preserveStartEnd"
                        />
                        <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
                        <Tooltip
                          labelFormatter={(time) =>
                            new Date(time).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          }
                        />
                        <Legend />
                        <Line type="monotone" dataKey="soil" stroke="#FF8042" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {selectedDeviceInfo?.type === DeviceType.DHT20_SENSOR && (
                  <>
                    <div className="bg-white/80 rounded-lg p-4 mt-4">
                      <div className="text-lg font-semibold mb-2">Temperature</div>

                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={temperatureChartData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="time"
                            tickFormatter={(time) =>
                              new Date(time).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            }
                            interval="preserveStartEnd"
                          />
                          <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
                          <Tooltip
                            labelFormatter={(time) =>
                              new Date(time).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            }
                          />
                          <Legend />
                          <Line type="monotone" dataKey="temp" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white/80 rounded-lg p-4 mt-4">
                      <div className="text-lg font-semibold mb-2">Humidity</div>

                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={humidityChartData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="time"
                            tickFormatter={(time) =>
                              new Date(time).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            }
                            interval="preserveStartEnd"
                          />
                          <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
                          <Tooltip
                            labelFormatter={(time) =>
                              new Date(time).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            }
                          />
                          <Legend />
                          <Line type="monotone" dataKey="humidity" stroke="#82ca9d" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                <div className="flex justify-between mt-4">
                  <button
                    onClick={handleEditDevice}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg"
                  >
                    Cập nhật
                  </button>

                  <button
                    onClick={() => setShowEditForm(false)}
                    className="px-6 py-2 bg-gray-400 text-white rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
                
              </div>
            </PopupModal>
          </div>
        </div>
      )}
    </div>
  );
}
