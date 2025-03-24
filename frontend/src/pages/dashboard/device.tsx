import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PopupModal from "../../layout/popupmodal";
import { DeviceType, InfovDeviceType } from "../../types/device.type";
import { deviceAPI } from "../../axios/device.api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


export default function UserManagementPage() {
  const [username, setUsername] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");

  // Hiển thị form thêm thông tin chi tiết của device
  const [showInfoForm, setShowInfoForm] = useState(false);

  const [permissionFilter, setPermissionFilter] = useState("All");


  
  // thiết bị được chọn để xóa
  const [selectedDevice, setSelectedDevice] = useState<string[]>([]);
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<InfovDeviceType | null>(null);


  const [showAddForm, setShowAddForm] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: "",
    type: DeviceType.MOISTURE_SENSOR,
    location: "",
    status: true,
  });

  // Dữ liệu thiêt bị




  const usersDevice = [
    {
      deviceId: "1",
      name: "Soil Moisture Sensor",
      type: DeviceType.MOISTURE_SENSOR,
      location: "Khu 1",
      status: true,
    },
    {
      deviceId: "2",
      name: "Water Pump",
      type: DeviceType.PUMP,
      location: "Khu 1",
      status: true,
    },
    {
      deviceId: "3",
      name: "Temperature Sensor",
      type: DeviceType.DHT20_SENSOR,
      location: "Khu 2",
      status: true,
    },
    {
      deviceId: "4",
      name: "LCD Display",
      type: DeviceType.LCD,
      location: "Khu  2",
      status: true,
    },
    {
      deviceId: "5",
      name: "Water Valve A",
      type: DeviceType.RELAY,
      location: "Khu 2",
      status: true,
    },
    {
          deviceId: "6",
          name: "Soil Moisture Sensor",
          type: DeviceType.MOISTURE_SENSOR,
          location: "Khu 2",
          status: true,
      
    },
  ];

  

  // Lấy username từ localStorage (nếu có)
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
      time: `${startHour + startIndex + index}:00 ${
        startHour + startIndex + index >= 12 ? "PM" : "AM"
      }`,
      value: value,
    }));
  };

  // Lọc theo tên, địa điểm
  const filteredUsers = usersDevice.filter((device) => {
    const inSearch =
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!inSearch) return false;

    // Lọc theo loại
    if (permissionFilter !== "All" && device.type !== permissionFilter) {
      return false;
    }

    return true;
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
       await deviceAPI.createDevice(newDevice);
      fetchDevice();
      setShowAddForm(false);
      setNewDevice({
        name: "",
        location: "",
        type: DeviceType.MOISTURE_SENSOR,
        status: true,
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
         await deviceAPI.deleteDevice(selectedDevice);
        setSelectedDevice([]);
        fetchDevice();
    } catch (error) {
        console.error("Lỗi khi xóa người dùng:", error);
    }
  };








  const toggleSelectUser = (userId: string) => {
    setSelectedDevice((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
};

const handleOpenInfoForm = (device: InfovDeviceType) => {
  setSelectedDeviceInfo(device);
  setShowInfoForm(true);
};


  return (
    <div className="container">
      
      {/* Nếu muốn giữ lại lời chào: */}
      {/* <h2 className="welcome">Welcome, {username}!</h2> */}

      {/* Thanh tìm kiếm + lọc + logo + nút Add */}
      <div className="filterContainer">
        {/* <div className="logoCircle">1</div> */}
        {/* //thanh tìm kiếm */}
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
          {/*  PUMP = "PUMP",
                MOISTURE_SENSOR = "MOISTURE_SENSOR",
                DHT20_SENSOR = "DHT20_SENSOR",
                LCD = "LCD",
                RELAY = "RELAY"
     */}
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

      {/* Bảng hiển thị danh sách người dùng */}
      
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
                        const deviceinfo: InfovDeviceType = 
                          {
                              deviceId: device.deviceId,
                              name: device.name,
                              type: device.type, 
                              location: device.location,
                              status: device.status,
                              value: [30, 40 , 50, 60, 20, 30, 60, 70, 30, 40 , 50, 60, 20, 30, 60, 70 ] //giá trị của cảm biến gọi API sau
                          };
                                        
                          handleOpenInfoForm(deviceinfo);
                        }} 
                      className="text-blue-500 hover:underline">
                      {device.name}
                    </button>       
                  </td>
                  <td>{device.location}</td>
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
            {/* location: string */}
            <input
              type="text"
              name="location"
              value={newDevice.location}
              onChange={handleNewDeviceChange}
            />
          </label>
          
          <label>
            Type:
            {/*    PUMP = "PUMP",
                    MOISTURE_SENSOR = "MOISTURE_SENSOR",
                    DHT20_SENSOR = "DHT20_SENSOR",
                    LCD = "LCD",
                    RELAY = "RELAY" 
            */}
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
            {selectedDeviceInfo.value && selectedDeviceInfo.value.length > 0 && (
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
            )}



            {/* Thông tin thiết bị */}
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
                <label className="font-bold">Location</label>
                <input
                  type="text"
                  value={selectedDeviceInfo.location}
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
              {/* <div>
                <label className="font-bold">Threshold</label>
                <input
                  type="text"
                  value={selectedDeviceInfo.threshold || "N/A"}
                  readOnly
                  className="w-full p-2 rounded-lg bg-gray-200"
                />
              </div> */}
            </div>

            {/* Nút điều khiển */}
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








      
      <style jsx>{`
        /* Container chính: đặt background, canh giữa, v.v. */
        .container {
          /* Thay link ảnh nền thật của bạn vào đây */
          background: url("https://images.unsplash.com/photo-1562075219-5356a05c8db5?fit=crop&w=1600&q=80")
            no-repeat center center fixed;
          background-size: cover;
          padding: 20px;
          font-family: Arial, sans-serif;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Logo hình tròn góc trái (nếu muốn) */
        .logoCircle {
          width: 30px;
          height: 30px;
          background-color: #e74c3c;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 10px;
        }

        /* Nếu muốn hiển thị tiêu đề chào */
        .welcome {
          margin-bottom: 20px;
          color: #fff;
          text-shadow: 1px 1px 2px #000;
        }

        /* Thanh chứa filter và nút Add */
        .filterContainer {
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 90%;
          padding: 10px;
          background-color: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(8px);
          border-radius: 8px;
        }

        /* Input tìm kiếm */
        .searchInput {
          flex: 1;
           padding: 6px 30px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        /* Dropdown chung */
        .selectInput {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          background-color: #fff;
          cursor: pointer;
        }

        /* Nút Add */
        .addButton {
          background-color: #2ecc71;
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        .addButton:hover {
          background-color: #27ae60;
        }

        /* Vùng chứa bảng */
        .tableContainer {
          background: rgba(255, 255, 255, 0.652);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          overflow-y: auto;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          height: 570px; 
          width: 90%;
          margin-bottom: 20px;

        }

        .userTable {
          width: 100%;
          border-collapse: collapse;
        }

        .userTable th,
        .userTable td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        /* Cố định header khi cuộn */
        .userTable thead {
          position: sticky;
          top: 0;
          background-color: #f7f7f7;
          z-index: 1;
        }

        .userTable thead th {
          font-weight: 600;
          color: #333;
        }

        .userTable tbody tr:hover {
          background-color: #f1f1f1;
          cursor: pointer;
        }

        .noResults {
          text-align: center;
          padding: 20px;
          color: #888;
        }

        /* Badge màu cho cột Permissions */
        .permissionBadge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          color: #fff;
          font-weight: bold;
        }
        .permissionBadge.admin {
          color: #e74c3c;
        }

        .permissionBadge.gardener {
          color: #3498db;
        }
        .permissionBadge.inactive {
          color: #f39c12;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .filterContainer {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .tableContainer {
            width: 100%;
            height: auto; /* Cho mobile dễ xem hơn */
            max-height: 591px;
          }
        }

        /* Popup Modal */
        .addButton {
          background-color: #2ecc71;
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        .addButton:hover {
          background-color: #27ae60;
        }
        .modalActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }
        label {
          display: block;
          margin-bottom: 10px;
        }
        input,
        select {
          width: 100%;
          padding: 8px;
          margin-top: 4px;
          margin-bottom: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
      `}</style>
    </div>
  );
}
