import {  useEffect, useState } from "react";
import { toast } from "react-toastify";
import PopupModal from "../../layout/popupmodal";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DeviceStatus, DeviceType, InfoDevicesType,  GetDevicesRequestType} from "../../types/device.type";
import { deviceApi } from "../../axios/device.api";
import "./device.scss"
import { recordAPI } from "../../axios/record.api";  
import { SensorDataResponseType, SensorDataRequestType }  from "../../types/record.type";
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
  //const [username, setUsername] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [first, setFirst] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [searchText, setSearchText] = useState("");
  const [locationIdFilter, setLocationIdFilter] = useState("");
  const [devices, setDevices] = useState<InfoDevicesType[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);

 
  // Hiển thị form thêm thông tin chi tiết của device
  const [showInfoForm, setShowInfoForm] = useState(false);

  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedDevice, setSelectedDevice] = useState<string[]>([]);
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<InfoDevicesType | null>(null);


  const [showAddForm, setShowAddForm] = useState(false);
  const [recordData, setRecordData] = useState<Record<string, { temp: number, humidity: number, soil: number }>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  const [temperatureChartData, setTemperatureChartData] = useState<Record<string, Array<{ time: number, temp: number }>>>({});
  const [humidityChartData, setHumidityChartData] = useState<Record<string, Array<{ time: number, humidity: number }>>>({});
  const [soilChartData, setSoilChartData] = useState<Record<string, Array<{ time: number, soil: number }>>>({});
  const [timeFilter, setTimeFilter] = useState(30); // days (min:1, max:7)
  
  const [newDevice, setNewDevice] = useState({
    name: "",
    type: DeviceType.MOISTURE_SENSOR,
    locationName: "",
    status: DeviceStatus.ACTIVE,
  });




  const fetchDevice = async () => {
      setLoading(true);
      const validStatus: DeviceStatus | 'ALL' | undefined =
      statusFilter === "All" ? "ALL" : (statusFilter as DeviceStatus); 
      const request: GetDevicesRequestType = {
        page: Math.ceil(first / rows) + 1, // Tính trang hiện tại
        items_per_page: rows, // Số thiết bị trên mỗi trang
        search: searchText.trim(), // Tìm kiếm theo chuỗi người dùng nhập
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

    //sửa lỗi không lấy được dữ liệu từ API
  const fetchDeviceData = async (selectedDevice: string): Promise<Record<string, { temp: number; humidity: number; soil: number }>> => {
      try {
          const params: SensorDataRequestType = {
              deviceId: selectedDevice,
              start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),  // 60
              stop: new Date().toISOString(),
          };
          
          const response: SensorDataResponseType = await recordAPI.getDeviceRecords(params);
          if (!response) return {};
          
          const newRecordData: Record<string, { temp: number; humidity: number; soil: number }> = {};
          
          response.dht20?.forEach(record => {
              const timestamp = new Date(record.timestamp).getTime();
              newRecordData[timestamp] = {
                  temp: record._avg.temperature ?? 0,
                  humidity: record._avg.humidity ?? 0,
                  soil: 0, 
              };
          });
          
          response.moisture?.forEach(record => {
              const timestamp = new Date(record.timestamp).getTime();
              if (newRecordData[timestamp]) {
                  newRecordData[timestamp].soil = record._avg.soilMoisture ?? 0;
              } else {
                  newRecordData[timestamp] = { temp: 0, humidity: 0, soil: record._avg.soilMoisture ?? 0 };
              }
          });
          console.log("newRecordData", newRecordData);

          return newRecordData;
      } catch (error) {
          console.error("Error fetching device data:", error);
          return {};
      }
  };
  
    useEffect(() => {
      
      fetchDevice();
    }, [first, rows, statusFilter, order, searchText, locationIdFilter]);
    //sửa lỗi không lấy được dữ liệu từ API

    useEffect(() => {

      if (selectedDeviceInfo?.deviceId) {
        fetchDeviceData(selectedDeviceInfo.deviceId).then(response => {
              if (response) {
                  setRecordData(response);
              }
          });
      }



  }, [selectedDeviceInfo , currentTime]);

      //sửa lỗi không lấy được dữ liệu từ API

  useEffect(() => {
    if (!recordData || !selectedDeviceInfo) return;


    const newTimestamp = currentTime.getTime();
    const threshold = newTimestamp - 30 * 24 * 60 * 60 * 1000;

    if(!selectedDeviceInfo) return;
    setTemperatureChartData(prev => ({
      ...prev,
      [selectedDeviceInfo.deviceId]: Object.entries(recordData)
        .map(([time, data]) => ({ time: Number(time), temp: data.temp }))
        .filter(d => d.time >= threshold),
    }));

    setHumidityChartData(prev => ({
      ...prev,
      [selectedDeviceInfo.deviceId]: Object.entries(recordData)
        .map(([time, data]) => ({ time: Number(time), humidity: data.humidity }))
        .filter(d => d.time >= threshold),
    }));
    setSoilChartData(prev => ({
      ...prev,
      [selectedDeviceInfo.deviceId]: Object.entries(recordData)
        .map(([time, data]) => ({ time: Number(time), soil: data.soil }))
        .filter(d => d.time >= threshold),
    }));

  }, [recordData, selectedDeviceInfo, timeFilter]);

  const filteredUsers = devices.filter((device) => {
    const inSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.locationName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!inSearch) return false;

    // Lọc theo loại
    // if (statusFilter !== "All" && device.type !== statusFilter) {
    //   return false;
    // }

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

  
  

  return (
    <div className="container">

      {/* search */}
      <div className="filterContainer">
        <input
          type="text"
          placeholder="Search (tên,khu vực)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 px-4 py-2 text-lg"
          
        />

        {/* //thanh lọc theo type */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="selectInput"
        >
          <option value="All">All</option>
          <option value={DeviceStatus.ACTIVE}>ACTIVE</option>
          <option value={DeviceStatus.INACTIVE}>INACTIVE</option>
        </select>


        {/* thanh lọc theo order */}
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
          className="selectInput"
        >
          <option value="asc">Mới nhất</option>
          <option value="desc">Lâu nhất</option>
         </select>

        {/* chưa có tác dụng */}
        <button onClick={() => setShowAddForm(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
        >
          Add
        </button>
        <button onClick={handleDeleteDevice} disabled={selectedDevice.length === 0}
          className="bg-orange-600 text-white px-4 py-2 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
        >Delete</button>


      </div>
      <div className="tableContainer" >
        <table className="userTable">
          <thead>
            <tr>
              <th>  </th>
              <th>Tên</th> {/* name: string; */}
              <th>Địa điểm</th> {/* address: string; */}
              <th>Loại</th> {/* role: string; */}
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((device, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedDevice.includes(device.deviceId)}
                      onChange={() => toggleSelectUser(device.deviceId)}
                      className="w-5 h-5"
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        const deviceinfo: InfoDevicesType =
                        {
                          deviceId: device.deviceId,
                          name: device.name,
                          type: device.type,
                          locationName: device.locationName,
                          status: device.status,
                          updatedAt: '',
                          // value: [30, 40 , 50, 60, 20, 30, 60, 70, 30, 40 , 50, 60, 20, 30, 60, 70 ] //giá trị của cảm biến gọi API sau
                        };

                        handleOpenInfoForm(deviceinfo);
                      }}
                      className="text-blue-500 hover:underline">
                      {device.name}
                    </button>
                  </td>
                  <td>{device.locationName}</td>
                  <td>{device.type}</td>
                  <td> {device.status}</td>


                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="noResults">
                  No matching device found.
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
            {/* name: string */}
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
            >Create</button>

            <button onClick={() => setShowAddForm(false)}
              className="px-6 py-2 border-2 border-orange-500 text-orange-500 font-bold rounded-lg shadow-lg hover:bg-orange-500 hover:text-white transition-all duration-200"
            >Cancel</button>

          </div>
        </PopupModal>
      )}
      {showInfoForm && selectedDeviceInfo && (
        <PopupModal title="Thông tin thiết bị" onClose={() => setShowInfoForm(false)}>
          <div className="p-4 bg-white/80 rounded-lg shadow-md">

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
                  value={selectedDeviceInfo.status ? "On" : "Off"}
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



            {selectedDeviceInfo.type === DeviceType.MOISTURE_SENSOR && (
              
              <div 
                  //sửa lỗi không lấy được dữ liệu từ API

                // onClick={() => openChartModal("soil")} className="cursor-pointer bg-white/80 rounded-lg p-4"
              >
                <div className="text-lg font-semibold mb-2">Soil Moisture</div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={soilChartData[selectedDeviceInfo.deviceId] || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tickFormatter={time =>
                        new Date(time).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      }
                    />
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip
                      labelFormatter={time =>
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

          </div>
        </PopupModal>
      )}

    </div>
  );
}
