import { useEffect, useState } from "react";
import { LONG_DATE_FORMAT, TIME_FORMAT } from "../../types/date.type";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { recordApi } from "../../axios/record.api"; 

export default function DashboardPage() {
  // Khởi tạo areaData ban đầu là rỗng
  const [areaData, setAreaData] = useState<Record<number, { weather: string, temp: number, humidity: number, ac: number, soil: number }>>({});
  const [activeArea, setActiveArea] = useState<number | null>(null);
  const [username, setUsername] = useState("User");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [showModal, setShowModal] = useState(false);
  const [newAreaData, setNewAreaData] = useState({ name: "" });

  const [showAreaList, setShowAreaList] = useState(false);
  const [editingArea, setEditingArea] = useState<number | null>(null);
  const [editingAreaData, setEditingAreaData] = useState({ name: "", temp: 0, humidity: 0, ac: 0, soil: 50 });

  const [temperatureChartData, setTemperatureChartData] = useState<Record<number, Array<{ time: number, temp: number }>>>({});
  const [humidityChartData, setHumidityChartData] = useState<Record<number, Array<{ time: number, humidity: number }>>>({});
  const [soilChartData, setSoilChartData] = useState<Record<number, Array<{ time: number, soil: number }>>>({});

  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState("");
  const [timeFilter, setTimeFilter] = useState(7); // days (min:1, max:7)

  // Lấy username từ localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  // Cập nhật thời gian mỗi giây
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Call API lấy dữ liệu khu vực khi component mount
  useEffect(() => {
    async function fetchAreaData() {
      try {
        // Ví dụ: truyền params nếu cần, cấu trúc SensorDataRequestType phụ thuộc dự án
        const params = { /* truyền các tham số cần thiết */ };
        const response = await recordAPI.getDeviceRecords(params);
        // Giả sử response trả về là mảng các record, chuyển đổi sang object:
        // Ví dụ: response = [{ weather: "Kv1", temp: 35, humidity: 80, ac: 18, soil: 50 }, ...]
        const mappedData = response.reduce((acc: any, record: any, index: number) => {
          acc[index + 1] = record;
          return acc;
        }, {});
        setAreaData(mappedData);
        // Nếu có dữ liệu, set activeArea là khu vực đầu tiên
        if (Object.keys(mappedData).length > 0) {
          setActiveArea(Number(Object.keys(mappedData)[0]));
        }
      } catch (error) {
        console.error("Failed to fetch device records", error);
      }
    }
    fetchAreaData();
  }, []);

  // Cập nhật dữ liệu biểu đồ dựa vào thời gian và khu vực đang active
  useEffect(() => {
    if (activeArea && areaData[activeArea]) {
      const newTimestamp = currentTime.getTime();
      const threshold = currentTime.getTime() - 7 * 24 * 60 * 60 * 1000;
      setTemperatureChartData(prev => {
        const data = prev[activeArea] || [];
        const updated = [...data, { time: newTimestamp, temp: areaData[activeArea].temp }]
          .filter(d => d.time >= threshold);
        return { ...prev, [activeArea]: updated };
      });
      setHumidityChartData(prev => {
        const data = prev[activeArea] || [];
        const updated = [...data, { time: newTimestamp, humidity: areaData[activeArea].humidity }]
          .filter(d => d.time >= threshold);
        return { ...prev, [activeArea]: updated };
      });
      setSoilChartData(prev => {
        const data = prev[activeArea] || [];
        const updated = [...data, { time: newTimestamp, soil: areaData[activeArea].soil }]
          .filter(d => d.time >= threshold);
        return { ...prev, [activeArea]: updated };
      });
    }
  }, [currentTime, activeArea, areaData]);

  const dateString = currentTime.toLocaleDateString("vi-VN", LONG_DATE_FORMAT);
  const timeString = currentTime.toLocaleTimeString("vi-VN", TIME_FORMAT);

  const handleAddArea = () => {
    setShowModal(true);
  };

  const handleSaveNewArea = () => {
    const newIndex = Object.keys(areaData).length + 1;
    setAreaData({
      ...areaData,
      [newIndex]: {
        weather: newAreaData.name || "New Area",
        temp: 0,       // default value
        humidity: 0,   // default value
        ac: 0,         // default value
        soil: 50,      // default value
      },
    });
    setActiveArea(newIndex);
    setNewAreaData({ name: "" });
    setShowModal(false);
  };

  const handleCancelNewArea = () => {
    setNewAreaData({ name: "" });
    setShowModal(false);
  };

  const handleOpenAreaList = () => {
    setShowAreaList(true);
  };

  const handleCloseAreaList = () => {
    setEditingArea(null);
    setShowAreaList(false);
  };

  const handleEditArea = (area: number) => {
    setEditingArea(area);
    const data = areaData[area];
    setEditingAreaData({ name: data.weather, temp: data.temp, humidity: data.humidity, ac: data.ac, soil: data.soil });
    setShowAreaList(false);
  };

  const handleSaveEditArea = (area: number) => {
    setAreaData({
      ...areaData,
      [area]: {
        weather: editingAreaData.name,
        temp: editingAreaData.temp,
        humidity: editingAreaData.humidity,
        ac: editingAreaData.ac,
        soil: editingAreaData.soil,
      },
    });
    setEditingArea(null);
  };

  const handleCancelEditArea = () => {
    setEditingArea(null);
  };

  const handleDeleteArea = (area: number) => {
    const updatedData = { ...areaData };
    delete updatedData[area];
    setAreaData(updatedData);
    if (activeArea === area) {
      const keys = Object.keys(updatedData);
      setActiveArea(keys.length ? Number(keys[0]) : null);
    }
  };

  const openChartModal = (chartType: string) => {
    setSelectedChart(chartType);
    setShowChartModal(true);
  };

  const getFilteredChartData = () => {
    const threshold = currentTime.getTime() - timeFilter * 24 * 60 * 60 * 1000;
    let data: Array<any> = [];
    if (activeArea) {
      if (selectedChart === "temperature") data = temperatureChartData[activeArea] || [];
      else if (selectedChart === "humidity") data = humidityChartData[activeArea] || [];
      else if (selectedChart === "soil") data = soilChartData[activeArea] || [];
    }
    return data.filter(d => d.time >= threshold);
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url("https://images.unsplash.com/photo-1601979031925-6ec1913da212?auto=format&fit=crop&w=1920&q=80")`,
      }}
    >
      {/* Thanh trên cùng */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between p-4 bg-black/40">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
              1
            </span>
            <button className="text-white text-xl" title="Thông báo">
              <i className="fas fa-bell"></i>
            </button>
          </div>
          <span className="text-white text-lg font-semibold">
            Welcome Farm, {username}
          </span>
        </div>
        <div className="text-white text-right">
          <div className="text-sm font-medium">{dateString}</div>
          <div className="text-sm">{timeString}</div>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="absolute inset-0 flex items-center justify-center mt-16">
        <div className="bg-white/30 backdrop-blur-md rounded-xl w-11/12 max-w-5xl p-6">
          {/* Thanh chọn các khu vực */}
          <div className="flex space-x-4 mb-6">
            {Object.keys(areaData).map((areaKey) => {
              const area = Number(areaKey);
              return (
                <button
                  key={area}
                  onClick={() => setActiveArea(area)}
                  className={`px-4 py-2 rounded-lg shadow-sm font-semibold ${activeArea === area ? "bg-white/40 text-gray-800" : "bg-white/10 text-gray-800"}`}
                >
                  {areaData[area]?.weather || `Area ${area}`}
                </button>
              );
            })}
            <button
              onClick={handleAddArea}
              className="flex items-center justify-center w-10 h-10 rounded-full shadow-sm font-semibold bg-white/10 text-gray-800"
            >
              +
            </button>
            <button
              onClick={handleOpenAreaList}
              className="flex items-center justify-center w-10 h-10 rounded-full shadow-sm font-semibold bg-white/10 text-gray-800"
              title="Xem danh sách areas"
            >
              📋
            </button>
          </div>

          {/* Hiển thị thông tin khu vực */}
          {activeArea && areaData[activeArea] ? (
            <div className="flex flex-wrap justify-between gap-4 mb-6">
              <div className="flex-1 min-w-[200px] bg-white/80 rounded-lg p-4 flex flex-col items-center">
                <div className="text-xl font-semibold mb-1">Nhiệt độ</div>
                <div className="text-3xl font-bold">{areaData[activeArea].temp}°C</div>
                <div className="text-sm text-gray-600 mt-1">
                  Temperature
                </div>
              </div>
              <div className="flex-1 min-w-[200px] bg-white/80 rounded-lg p-4 flex flex-col items-center">
                <div className="text-xl font-semibold mb-1">Độ ẩm</div>
                <div className="text-3xl font-bold">{areaData[activeArea].humidity}%</div>
                <div className="text-sm text-gray-600 mt-1">Air humidity</div>
              </div>
              <div className="flex-1 min-w-[200px] bg-white/80 rounded-lg p-4 flex flex-col items-center">
                <div className="text-xl font-semibold mb-1">Độ ẩm đất</div>
                <div className="text-3xl font-bold">{areaData[activeArea].soil}%</div>
                <div className="text-sm text-gray-600 mt-1">Soil moisture</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">No area selected</div>
          )}

          {/* Biểu đồ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div onClick={() => openChartModal("temperature")} className="cursor-pointer bg-white/80 rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Average Temperature</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={temperatureChartData[activeArea || 0] || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
                  />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip labelFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })} />
                  <Legend />
                  <Line type="monotone" dataKey="temp" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div onClick={() => openChartModal("humidity")} className="cursor-pointer bg-white/80 rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Average Humidity</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={humidityChartData[activeArea || 0] || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
                  />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip labelFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })} />
                  <Legend />
                  <Line type="monotone" dataKey="humidity" stroke="#82ca9d" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div onClick={() => openChartModal("soil")} className="cursor-pointer bg-white/80 rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Soil Moisture</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={soilChartData[activeArea || 0] || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
                  />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip labelFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })} />
                  <Legend />
                  <Line type="monotone" dataKey="soil" stroke="#FF8042" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal thêm khu vực */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-bold mb-4">Thêm Area</h2>
            <div className="mb-2">
              <label className="block text-sm">Tên Area</label>
              <input 
                type="text" 
                value={newAreaData.name} 
                onChange={(e) => setNewAreaData({ name: e.target.value })} 
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => { setNewAreaData({ name: "" }); setShowModal(false); }} className="px-4 py-1 bg-gray-300 rounded">Hủy</button>
              <button onClick={handleSaveNewArea} className="px-4 py-1 bg-blue-500 text-white rounded">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal danh sách areas */}
      {showAreaList && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">Danh sách Areas</h2>
            <table className="w-full text-left mb-4">
              <thead>
                <tr>
                  <th className="border-b py-2">Area</th>
                  <th className="border-b py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(areaData).map((areaKey) => {
                  const area = Number(areaKey);
                  return (
                    <tr key={area}>
                      <td className="border-b py-2">Area {area}</td>
                      <td className="border-b py-2 space-x-2">
                        <button onClick={() => handleEditArea(area)} className="px-2 py-1 bg-green-500 text-white rounded">Edit</button>
                        <button onClick={() => handleDeleteArea(area)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex justify-end">
              <button onClick={handleCloseAreaList} className="px-4 py-1 bg-gray-300 rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa area */}
      {editingArea !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-bold mb-4">Chỉnh sửa Area</h2>
            <div className="mb-2">
              <label className="block text-sm">Tên Area</label>
              <input 
                type="text" 
                value={editingAreaData.name} 
                onChange={(e) => setEditingAreaData({ ...editingAreaData, name: e.target.value })}
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Temperature</label>
              <input 
                type="number" 
                value={editingAreaData.temp} 
                onChange={(e) => setEditingAreaData({ ...editingAreaData, temp: Number(e.target.value) })}
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Air humidity</label>
              <input 
                type="number" 
                value={editingAreaData.humidity} 
                onChange={(e) => setEditingAreaData({ ...editingAreaData, humidity: Number(e.target.value) })}
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Cooling mode</label>
              <input 
                type="number" 
                value={editingAreaData.ac} 
                onChange={(e) => setEditingAreaData({ ...editingAreaData, ac: Number(e.target.value) })}
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm">Độ ẩm đất</label>
              <input 
                type="number" 
                value={editingAreaData.soil} 
                onChange={(e) => setEditingAreaData({ ...editingAreaData, soil: Number(e.target.value) })}
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => handleSaveEditArea(editingArea)} className="px-4 py-1 bg-blue-500 text-white rounded">Save</button>
              <button onClick={handleCancelEditArea} className="px-4 py-1 bg-gray-300 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal biểu đồ đầy đủ với bộ lọc thời gian */}
      {showChartModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-11/12 max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedChart === "temperature" ? "Temperature" : selectedChart === "humidity" ? "Humidity" : "Soil Moisture"} Chart
              </h2>
              <button onClick={() => setShowChartModal(false)} className="px-4 py-1 bg-gray-300 rounded">Close</button>
            </div>
            <div className="flex space-x-2 mb-4">
              <button onClick={() => setTimeFilter(1)} className={`px-3 py-1 rounded ${timeFilter === 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>24 giờ gần nhất</button>
              <button onClick={() => setTimeFilter(3)} className={`px-3 py-1 rounded ${timeFilter === 3 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>3 ngày trước</button>
              <button onClick={() => setTimeFilter(7)} className={`px-3 py-1 rounded ${timeFilter === 7 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>1 tuần trước</button>
              <button onClick={() => setTimeFilter(30)} className={`px-3 py-1 rounded ${timeFilter === 30 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>1 tháng trước</button>
            </div>
            <div className="bg-white/80 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getFilteredChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    domain={[currentTime.getTime() - timeFilter * 24 * 60 * 60 * 1000, currentTime.getTime()]}
                    tickFormatter={time => {
                      const d = new Date(time);
                      return d.toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" }) + " " +
                             d.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
                    }} 
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={time => {
                      const d = new Date(time);
                      return d.toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" }) + " " +
                             d.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
                    }} 
                  />
                  <Legend />
                  {selectedChart === "temperature" && (
                    <Line type="monotone" dataKey="temp" stroke="#8884d8" activeDot={{ r: 8 }} />
                  )}
                  {selectedChart === "humidity" && (
                    <Line type="monotone" dataKey="humidity" stroke="#82ca9d" activeDot={{ r: 8 }} />
                  )}
                  {selectedChart === "soil" && (
                    <Line type="monotone" dataKey="soil" stroke="#FF8042" activeDot={{ r: 8 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
