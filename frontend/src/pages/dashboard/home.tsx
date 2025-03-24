import { useEffect, useState } from "react";
import { LONG_DATE_FORMAT, TIME_FORMAT } from "../../types/date.type";

export default function DashboardPage() {
  const [username, setUsername] = useState("User");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeArea, setActiveArea] = useState(1);
  
  const [areaData, setAreaData] = useState({
    1: { weather: "Sunny Day", temp: 21, humidity: 80, ac: 18 },
    2: { weather: "Cloudy",    temp: 22, humidity: 75, ac: 20 },
    3: { weather: "Rainy",     temp: 20, humidity: 85, ac: 17 },
    4: { weather: "Windy",     temp: 23, humidity: 70, ac: 19 },
  });

  const [showModal, setShowModal] = useState(false);
  const [newAreaData, setNewAreaData] = useState({
    name: "",
    temp: 0,
    humidity: 0,
    ac: 0,
  });

  const [showAreaList, setShowAreaList] = useState(false);
  const [editingArea, setEditingArea] = useState<number | null>(null);
  const [editingAreaData, setEditingAreaData] = useState({ name: "", temp: 0, humidity: 0, ac: 0 });

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
        temp: newAreaData.temp,
        humidity: newAreaData.humidity,
        ac: newAreaData.ac,
      },
    });
    setActiveArea(newIndex);
    setNewAreaData({ name: "", temp: 0, humidity: 0, ac: 0 });
    setShowModal(false);
  };

  const handleCancelNewArea = () => {
    setNewAreaData({ name: "", temp: 0, humidity: 0, ac: 0 });
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
    setEditingAreaData({ name: data.weather, temp: data.temp, humidity: data.humidity, ac: data.ac });
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

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url("https://images.unsplash.com/photo-1601979031925-6ec1913da212?auto=format&fit=crop&w=1920&q=80")`,
      }}
    >
      {/* Thanh trên cùng */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between p-4 bg-black/40">
        {/* Phần bên trái: icon hoặc nút menu, thông báo */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            {/* Thông báo (badge) */}
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
              1
            </span>
            <button className="text-white text-xl" title="Thông báo">
              <i className="fas fa-bell"></i>
            </button>
          </div>
          {/* Tên trang hoặc logo */}
          <span className="text-white text-lg font-semibold">
            Welcome Farm, {username}
          </span>
        </div>

        {/* Phần bên phải: thời gian */}
        <div className="text-white text-right">
          <div className="text-sm font-medium">{dateString}</div>
          <div className="text-sm">{timeString}</div>
        </div>
      </div>

      {/* Khối nội dung chính, có hiệu ứng mờ (glassmorphism) */}
      <div className="absolute inset-0 flex items-center justify-center mt-16">
        <div className="bg-white/30 backdrop-blur-md rounded-xl w-11/12 max-w-5xl p-6">
          {/* Thanh chọn các khu vực (Area) */}
          <div className="flex space-x-4 mb-6">
            {Object.keys(areaData).map((areaKey) => {
              const area = Number(areaKey);
              return (
                <button
                  key={area}
                  onClick={() => setActiveArea(area)}
                  className={`px-4 py-2 rounded-lg shadow-sm font-semibold ${activeArea === area ? "bg-white/40 text-gray-800" : "bg-white/10 text-gray-800"}`}
                >
                  Area {area}
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

          {/* Hàng hiển thị thông tin (thời tiết, độ ẩm, thiết bị) */}
          {activeArea && areaData[activeArea] ? (
            <div className="flex flex-wrap justify-between gap-4 mb-6">
              <div className="flex-1 min-w-[200px] bg-white/80 rounded-lg p-4 flex flex-col items-center">
                <div className="text-xl font-semibold mb-1">{areaData[activeArea].weather}</div>
                <div className="text-3xl font-bold">{areaData[activeArea].temp}°C</div>
                <div className="text-sm text-gray-600 mt-1">
                  Nhiệt độ ngoài trời
                </div>
              </div>
              <div className="flex-1 min-w-[200px] bg-white/80 rounded-lg p-4 flex flex-col items-center">
                <div className="text-xl font-semibold mb-1">Độ ẩm</div>
                <div className="text-3xl font-bold">{areaData[activeArea].humidity}%</div>
                <div className="text-sm text-gray-600 mt-1">Độ ẩm không khí</div>
              </div>
              <div className="flex-1 min-w-[200px] bg-white/80 rounded-lg p-4 flex flex-col items-center">
                <div className="text-xl font-semibold mb-1">Air Conditioner</div>
                <div className="text-3xl font-bold">{areaData[activeArea].ac}°C</div>
                <div className="text-sm text-gray-600 mt-1">Cooling mode</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">No area selected</div>
          )}

          {/* Khu vực biểu đồ (placeholder) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Average Temperature</div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="border-b py-2 px-4">Area</th>
                    <th className="border-b py-2 px-4">Temperature (°C)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b py-2 px-4">Area 1</td>
                    <td className="border-b py-2 px-4">22</td>
                  </tr>
                  <tr>
                    <td className="border-b py-2 px-4">Area 2</td>
                    <td className="border-b py-2 px-4">24</td>
                  </tr>
                  <tr>
                    <td className="border-b py-2 px-4">Area 3</td>
                    <td className="border-b py-2 px-4">23</td>
                  </tr>
                  <tr>
                    <td className="border-b py-2 px-4">Area 4</td>
                    <td className="border-b py-2 px-4">21</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-white/80 rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Average Humidity</div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="border-b py-2 px-4">Area</th>
                    <th className="border-b py-2 px-4">Humidity (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b py-2 px-4">Area 1</td>
                    <td className="border-b py-2 px-4">75</td>
                  </tr>
                  <tr>
                    <td className="border-b py-2 px-4">Area 2</td>
                    <td className="border-b py-2 px-4">80</td>
                  </tr>
                  <tr>
                    <td className="border-b py-2 px-4">Area 3</td>
                    <td className="border-b py-2 px-4">78</td>
                  </tr>
                  <tr>
                    <td className="border-b py-2 px-4">Area 4</td>
                    <td className="border-b py-2 px-4">82</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal for adding a new area */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-bold mb-4">Thêm Area</h2>
            <div className="mb-2">
              <label className="block text-sm">Tên Area</label>
              <input 
                type="text" 
                value={newAreaData.name} 
                onChange={(e) => setNewAreaData({ ...newAreaData, name: e.target.value })} 
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Nhiệt độ ngoài trời</label>
              <input 
                type="number" 
                value={newAreaData.temp} 
                onChange={(e) => setNewAreaData({ ...newAreaData, temp: Number(e.target.value) })} 
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Độ ẩm không khí</label>
              <input 
                type="number" 
                value={newAreaData.humidity} 
                onChange={(e) => setNewAreaData({ ...newAreaData, humidity: Number(e.target.value) })} 
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm">Cooling mode</label>
              <input 
                type="number" 
                value={newAreaData.ac} 
                onChange={(e) => setNewAreaData({ ...newAreaData, ac: Number(e.target.value) })} 
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={handleCancelNewArea} className="px-4 py-1 bg-gray-300 rounded">Hủy</button>
              <button onClick={handleSaveNewArea} className="px-4 py-1 bg-blue-500 text-white rounded">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* New Modal for listing areas with edit/delete */}
      {showAreaList && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">Danh sách Areas</h2>
            <table className="w-full text-left mb-4">
              <thead>
                <tr>
                  <th className="border-b py-2">Area</th>
                  {/* Removed the "Tên" column */}
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

      {/* New modal for editing an area */}
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
              <label className="block text-sm">Nhiệt độ ngoài trời</label>
              <input 
                type="number" 
                value={editingAreaData.temp} 
                onChange={(e) => setEditingAreaData({ ...editingAreaData, temp: Number(e.target.value) })}
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Độ ẩm không khí</label>
              <input 
                type="number" 
                value={editingAreaData.humidity} 
                onChange={(e) => setEditingAreaData({ ...editingAreaData, humidity: Number(e.target.value) })}
                className="w-full border rounded p-1" 
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm">Cooling mode</label>
              <input 
                type="number" 
                value={editingAreaData.ac} 
                onChange={(e) => setEditingAreaData({ ...editingAreaData, ac: Number(e.target.value) })}
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

    </div>
  );
}
