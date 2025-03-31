import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import PopupModal from "../../layout/popupmodal";
import { DeviceStatus, DeviceType, InfoDevicesType, GetDevicesRequestType } from "../../types/device.type";
import { deviceApi } from "../../axios/device.api";
import { recordAPI } from "../../axios/record.api";
import { SensorDataResponseType, SensorDataRequestType } from "../../types/record.type";
import "./device.scss";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FaChevronDown } from "react-icons/fa";

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

export default function UserManagementPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [first, setFirst] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [searchText, setSearchText] = useState("");
  const [locationIdFilter, setLocationIdFilter] = useState("");
  const [devices, setDevices] = useState<InfoDevicesType[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const [showInfoForm, setShowInfoForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedDevice, setSelectedDevice] = useState<string[]>([]);
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<InfoDevicesType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [recordData, setRecordData] = useState<Record<string, { temp: number, humidity: number, soil: number }>>({});
  const [temperatureChartData, setTemperatureChartData] = useState<Array<{ time: number, temp: number }>>([]);
  const [humidityChartData, setHumidityChartData] = useState<Array<{ time: number, humidity: number }>>([]);
  const [soilChartData, setSoilChartData] = useState<Array<{ time: number, soil: number }>>([]);
  const [timeFilter, setTimeFilter] = useState(30); // days (min:1, max:7)

  const [newDevice, setNewDevice] = useState({
    name: "",
    type: DeviceType.MOISTURE_SENSOR,
    locationName: "",
    status: DeviceStatus.ACTIVE,
  });

  const infoModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowInfoForm(false);
      }
    };
    if (showInfoForm) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showInfoForm]);

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

  useEffect(() => {
    fetchDevice();
  }, [first, rows, statusFilter, order, searchText, locationIdFilter]);

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

  const filteredUsers = devices.filter((device) => {
    const inSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.locationName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!inSearch) return false;

    return DeviceStatus.ACTIVE;
  });

  const handleNewDeviceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDevice((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateDevice = async () => {
    try {
      await deviceApi.addDevice(newDevice);
      fetchDevice();
      setShowAddForm(false);
      setNewDevice({
        name: "",
        locationName: "",
        type: DeviceType.MOISTURE_SENSOR,
        status: DeviceStatus.ACTIVE,
      });
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

  const toggleSelectUser = (userId: string) => {
    setSelectedDevice((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleOpenInfoForm = (device: InfoDevicesType) => {
    setSelectedDeviceInfo(device);
    setShowInfoForm(true);
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

  return (
    <div className="container">
      <div className="filterContainer flex items-center gap-4">
        <input
          type="text"
          placeholder="Tìm kiếm (tên, khu vực)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
            {filteredUsers.length > 0 ? (
              filteredUsers.map((device, index) => (
                <tr key={index} onClick={() => handleOpenInfoForm(device)}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedDevice.includes(device.deviceId)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelectUser(device.deviceId)}
                      className="w-5 h-5"
                    />
                  </td>
                  <td>
                    {device.name}
                  </td>
                  <td>{device.locationName}</td>
                  <td>{device.type}</td>
                  <td> {device.status}</td>
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
      </div>
      {showAddForm && (
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
            Khu vực:
            <input
              type="text"
              name="locationName"
              value={newDevice.locationName}
              onChange={handleNewDeviceChange}
            />
          </label>

          <label>
            Type:
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
          <div className="flex justify-between mt-4 w-full">
            <button onClick={handleCreateDevice}
              className="px-6 py-2 border-2 border-orange-500 text-orange-500 font-bold rounded-lg shadow-lg hover:bg-orange-500 hover:text-white transition-all duration-200"
            >Tạo</button>

            <button onClick={() => setShowAddForm(false)}
              className="px-6 py-2 border-2 border-orange-500 text-orange-500 font-bold rounded-lg shadow-lg hover:bg-orange-500 hover:text-white transition-all duration-200"
            >Hủy</button>
          </div>
        </PopupModal>
      )}
      {showInfoForm && selectedDeviceInfo && (
        <div className="modal-overlay" onClick={() => setShowInfoForm(false)}>
          <div ref={infoModalRef} onClick={(e) => e.stopPropagation()}>
            <PopupModal title="Thông tin thiết bị" onClose={() => setShowInfoForm(false)}>
              <div className="p-4 bg-white/80 rounded-lg shadow-md" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold">Name</label>
                    <input
                      type="text"
                      value={selectedDeviceInfo.name}
                      readOnly
                      className="w-full p-2 rounded-lg bg-gray-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold">locationName</label>
                    <input
                      type="text"
                      value={selectedDeviceInfo.locationName}
                      readOnly
                      className="w-full p-2 rounded-lg bg-gray-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Type</label>
                    <input
                      type="text"
                      value={selectedDeviceInfo.type}
                      readOnly
                      className="w-full p-2 rounded-lg border-2 border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Status</label>
                    <input
                      type="text"
                      value={selectedDeviceInfo.status}
                      readOnly
                      className="w-full p-2 rounded-lg bg-gray-200"
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setShowInfoForm(false)}
                    className="px-4 py-2 bg-orange-400 text-white rounded-lg shadow-md hover:bg-orange-500"
                  >
                    Back
                  </button>
                </div>

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
              </div>
            </PopupModal>
          </div>
        </div>
      )}
    </div>
  );
}
