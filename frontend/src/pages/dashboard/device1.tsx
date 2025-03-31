import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PopupModal from "../../layout/popupmodal";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DeviceStatus, DeviceType, InfoDevicesType } from "../../types/device.type";
import { deviceApi } from "../../axios/device.api";
import "./device.scss"


export default function UserManagementPage() {
  const [username, setUsername] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");

  // Hiển thị form thêm thông tin chi tiết của device
  const [showInfoForm, setShowInfoForm] = useState(false);

  const [permissionFilter, setPermissionFilter] = useState("All");

  const [selectedDevice, setSelectedDevice] = useState<string[]>([]);
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<InfoDevicesType | null>(null);


  const [showAddForm, setShowAddForm] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: "",
    type: DeviceType.MOISTURE_SENSOR,
    locationName: "",
    status: DeviceStatus.ACTIVE,
  });

  const usersDevice = [
    {
      deviceId: "1",
      name: "Soil Moisture Sensor",
      type: DeviceType.MOISTURE_SENSOR,
      locationName: "Khu 1",
      status: DeviceStatus.ACTIVE,
    },
  ];
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  const generateChartData = (values: number[]) => {
    const startHour = 5;
    const limitedValues = values.slice(-10); // Lấy 10 giá trị cuối cùng
    const startIndex = Math.max(0, values.length - 10);

    return limitedValues.map((value, index) => ({
      time: `${startHour + startIndex + index}:00 ${startHour + startIndex + index >= 12 ? "PM" : "AM"
        }`,
      value: value,
    }));
  };

  // Lọc theo tên, địa điểm
  const filteredUsers = usersDevice.filter((device) => {
    const inSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.locationName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!inSearch) return false;

    // Lọc theo loại
    if (permissionFilter !== "All" && device.type !== permissionFilter) {
      return false;
    }

    return DeviceStatus.ACTIVE;
  });


  /// chưa xong,  API
  const fetchDevice = () => {
    console.log("Fetching users...");
  };


  // Xử lý thay đổi giá trị của form thêm user
  const handleNewDeviceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDevice((prev) => ({ ...prev, [name]: value }));
  };

  //= chưa xong
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
  // chưa xong
  const handleDeleteDevice = async () => {
    if (selectedDevice.length === 0) return;
    try {
      await deviceApi.deleteDevices({ deviceIds: selectedDevice }); // 🔥 Sửa ở đây
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
          value={permissionFilter}
          onChange={(e) => setPermissionFilter(e.target.value)}
          className="selectInput"
        >
          <option value="All">Type</option>
          <option value="PUMP">PUMP</option>
          <option value="MOISTURE_SENSOR">MOISTURE_SENSOR</option>
          <option value="DHT20_SENSOR">DHT20_SENSOR</option>
          <option value="LCD">LCD</option>
          <option value="RELAY">RELAY</option>
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


                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="noResults">
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
              <option value="All">Type</option>
              <option value="PUMP">PUMP</option>
              <option value="MOISTURE_SENSOR">MOISTURE_SENSOR</option>
              <option value="DHT20_SENSOR">DHT20_SENSOR</option>
              <option value="LCD">LCD</option>
              <option value="RELAY">RELAY</option>
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

            {/* Biểu đồ nhận một mảng giá trị, thời gian ghi lại là mặc định, tính theo giờ*/}
            {/* {selectedDeviceInfo.value && selectedDeviceInfo.value.length > 0 && (
              <div className="w-full max-w-md h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData(selectedDeviceInfo.value)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#ff7300" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )} */}
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
          </div>
        </PopupModal>
      )}

    </div>
  );
}
