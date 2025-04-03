import { useEffect, useState } from "react";
import { LONG_DATE_FORMAT, TIME_FORMAT } from "../../types/date.type";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { recordAPI } from "../../axios/record.api";
import { locationApi } from "../../axios/location.api";
import { LocationRecordQueryType, SensorDataResponseType } from "../../types/record.type";

import { GetLocationsRequestType, CreateLocationType, UpdateLocationType, DeleteLocationType, FindAllLocationsType, InfoLocationType } from "../../types/location.type";

export default function DashboardPage() {
  const [areaData, setAreaData] = useState<Record<number, { weather: string, temp: number, humidity: number, ac: number, soil: number }>>({});
  const [activeArea, setActiveArea] = useState<number | null>(null);
  const [username, setUsername] = useState("User");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [newAreaData, setNewAreaData] = useState({ name: "" });

  const [showAreaList, setShowAreaList] = useState(false);
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editingAreaData, setEditingAreaData] = useState<UpdateLocationType>({ locationId: "", name: "" });

  const [temperatureChartData, setTemperatureChartData] = useState<Record<string, Array<{ time: number, temp: number }>>>({});
  const [humidityChartData, setHumidityChartData] = useState<Record<string, Array<{ time: number, humidity: number }>>>({});
  const [soilChartData, setSoilChartData] = useState<Record<string, Array<{ time: number, soil: number }>>>({});

  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState("");
  const [timeFilter, setTimeFilter] = useState(30); // days (min:1, max:7)
  const [fixedDate, setFixedDate] = useState<string>("");
  const [searchStart, setSearchStart] = useState<string>("");
  const [searchEnd, setSearchEnd] = useState<string>("");

  const [locationData, setLocationData] = useState<FindAllLocationsType>({ locations: [] });
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const [recordData, setRecrordData] = useState<Record<string, { temp: number, humidity: number, soil: number }>>({});
  const [isDataStale, setIsDataStale] = useState(false);

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await locationApi.getAllLocations({ search: "", order: "asc" });
        setLocationData(response);

        // Chỉ cập nhật selectedLocation nếu response có dữ liệu
        if (response.locations.length > 0) {
          setSelectedLocation(response.locations[0].locationId);
        }

        console.log(response);
      } catch (err) {
        console.error("Failed to fetch locations.");
      }
    };

    fetchLocationData();
  }, []);

  // Lấy username từ localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("name");
    if (storedUser) {
      setUsername(storedUser.slice(1, -1)); // Cắt bỏ ký tự đầu và cuối
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
    if (!selectedLocation) return;

    async function fetchAreaData() {
      try {
        const params: LocationRecordQueryType = {
          locationId: selectedLocation,
          start: new Date(currentTime.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          stop: currentTime.toISOString(),
        };
        const response: SensorDataResponseType = await recordAPI.getLocationRecords(params);

        if (!response) return;

        // Cập nhật recordData với dữ liệu mới
        const newRecordData: Record<string, { temp: number; humidity: number; soil: number }> = {};
        response.dht20?.forEach(record => {
          const timestamp = new Date(record.timestamp).getTime();
          newRecordData[timestamp] = {
            temp: record._avg.temperature ?? 0,
            humidity: record._avg.humidity ?? 0,
            soil: 0, // Sẽ cập nhật từ MoistureRecordType
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

        setRecrordData(newRecordData);

        // Cập nhật areaData
        if (Object.keys(newRecordData).length > 0) {
          setAreaData(prev => ({
            ...prev,
            [selectedLocation]: {
              weather: "N/A",
              temp: newRecordData[currentTime.getTime()]?.temp || 0,
              humidity: newRecordData[currentTime.getTime()]?.humidity || 0,
              ac: 0,
              soil: newRecordData[currentTime.getTime()]?.soil || 0,
            },
          }));

          // Cập nhật activeArea nếu chưa có
          if (!activeArea) setActiveArea(Number(selectedLocation));
        }

      } catch (error) {
        console.error("Failed to fetch location records", error);
      }
    }

    fetchAreaData();
  }, [selectedLocation, currentTime]);

  // Cập nhật dữ liệu biểu đồ
  useEffect(() => {
    if (!recordData) return;

    const newTimestamp = currentTime.getTime();
    // Sử dụng timeFilter để tính toán threshold (đổi từ 30 sang timeFilter cho nhất quán)
    const threshold = newTimestamp - timeFilter * 24 * 60 * 60 * 1000;

    setTemperatureChartData(prev => ({
      ...prev,
      [selectedLocation]: Object.entries(recordData)
        .map(([time, data]) => ({ time: Number(time), temp: data.temp }))
        .filter(d => d.time >= threshold)
        .sort((a, b) => a.time - b.time),
    }));

    setHumidityChartData(prev => ({
      ...prev,
      [selectedLocation]: Object.entries(recordData)
        .map(([time, data]) => ({ time: Number(time), humidity: data.humidity }))
        .filter(d => d.time >= threshold)
        .sort((a, b) => a.time - b.time),
    }));

    setSoilChartData(prev => ({
      ...prev,
      [selectedLocation]: Object.entries(recordData)
        .map(([time, data]) => ({ time: Number(time), soil: data.soil }))
        .filter(d => d.time >= threshold)
        .sort((a, b) => a.time - b.time),
    }));
  }, [currentTime, recordData, selectedLocation, timeFilter]);

  // Kiểm tra thời gian của dữ liệu backend so với currentTime
  useEffect(() => {
    if (selectedLocation && recordData) {
      const timestamps = Object.keys(recordData);
      if (timestamps.length > 0) {
        const maxTimestamp = Math.max(...timestamps.map(Number));
        if (currentTime.getTime() - maxTimestamp > 30 * 1000) { // chênh lệch hơn 30 giây
          setIsDataStale(true);
        } else {
          setIsDataStale(false);
        }
      }
    }
  }, [recordData, currentTime, selectedLocation]);

  useEffect(() => {
    if (!showChartModal) return;
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowChartModal(false);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [showChartModal]);

  useEffect(() => {
    if (!showModal) return;
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [showModal]);

  useEffect(() => {
    if (!showAreaList) return;
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAreaList(false);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [showAreaList]);

  const dateString = currentTime.toLocaleDateString("vi-VN", LONG_DATE_FORMAT);
  const timeString = currentTime.toLocaleTimeString("vi-VN", TIME_FORMAT);

  const handleAddArea = () => {
    setShowModal(true);
  };

  const handleSaveNewArea = async () => {
    try {
      // Gọi API để tạo khu vực mới
      const newLocation = await locationApi.createLocation(newAreaData);

      // Cập nhật danh sách khu vực sau khi tạo thành công
      const updatedLocations = await locationApi.getAllLocations({ search: "", order: "asc" });
      setLocationData(updatedLocations);
      setSelectedLocation(updatedLocations.locationId);
      setActiveArea(newLocation);

      // Đóng modal và reset dữ liệu nhập
      setNewAreaData({ name: "" });
      setShowModal(false);
    } catch (error) {
      console.error("Failed to create new location:", error);
    }
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

  const handleEditArea = (locationId: string) => {
    // Tìm khu vực cần chỉnh sửa từ danh sách
    const selectedArea = locationData.locations.find((loc) => loc.locationId === locationId);

    if (selectedArea) {
      setEditingArea(locationId);
      setEditingAreaData({ locationId, name: selectedArea.name });
      setShowAreaList(false);
    }
  };

  const handleSaveEditArea = async () => {
    if (!editingAreaData.name.trim()) {
      alert("Tên khu vực không được để trống!");
      return;
    }

    try {
      // Gọi API cập nhật khu vực
      await locationApi.updateLocation(editingAreaData);

      // Cập nhật danh sách khu vực sau khi chỉnh sửa
      const updatedLocations = await locationApi.getAllLocations({ search: "", order: "asc" });
      setLocationData(updatedLocations);

      // Đóng modal chỉnh sửa
      setEditingArea(null);
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  const handleCancelEditArea = () => {
    setEditingArea(null);
  };

  const handleDeleteArea = (locationId: string) => {
    setSelectedAreaId(locationId);
    setShowConfirmDelete(true);
  };

  const confirmDeleteArea = async () => {
    if (!selectedAreaId) return;

    try {
      await locationApi.deleteLocation({ locationId: selectedAreaId });

      // Cập nhật danh sách khu vực sau khi xóa thành công
      const updatedLocations = await locationApi.getAllLocations({ search: "", order: "asc" });
      setLocationData(updatedLocations);

      setDeleteMessage("Xóa khu vực thành công!");
    } catch (error: any) {
      if (error.response?.status === 403) {
        setDeleteMessage("Bạn không có quyền xóa khu vực này!");
      } else if (error.response?.status === 400) {
        setDeleteMessage("Khu vực này đã có dữ liệu, không thể xóa!");
      } else {
        setDeleteMessage("Có lỗi xảy ra, vui lòng thử lại!");
      }
    } finally {
      setShowConfirmDelete(false);
      setSelectedAreaId(null);
    }
  };

  const closeDeleteMessage = () => {
    setDeleteMessage(null);
  };


  const openChartModal = (chartType: string) => {
    setSelectedChart(chartType);
    setShowChartModal(true);
  };

  const getFilteredChartData = () => {
    if (!selectedLocation) return []; // Nếu không có location, trả về mảng rỗng

    let data: Array<any> = [];

    switch (selectedChart) {
      case "temperature":
        data = temperatureChartData[selectedLocation] ?? [];
        break;
      case "humidity":
        data = humidityChartData[selectedLocation] ?? [];
        break;
      case "soil":
        data = soilChartData[selectedLocation] ?? [];
        break;
      default:
        return [];
    }

    if (searchStart !== "" && searchEnd !== "") {
      const start = new Date(searchStart);
      const end = new Date(searchEnd);
      return data.filter(d => d.time >= start.getTime() && d.time <= end.getTime());
    }

    if (fixedDate !== "") {
      const start = new Date(fixedDate);
      start.setHours(0, 1, 0, 0);
      const end = new Date(fixedDate);
      end.setDate(end.getDate() + 1);
      end.setHours(0, 0, 0, 0);
      return data.filter(d => d.time >= start.getTime() && d.time < end.getTime());
    }

    const threshold = currentTime.getTime() - timeFilter * 24 * 60 * 60 * 1000;
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
            {/* <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
              1
            </span> */}
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
            {locationData.locations.map((area) => (
              <button
                key={area.locationId}
                onClick={() => setSelectedLocation(area.locationId)}
                className={`px-4 py-2 rounded-lg shadow-sm font-semibold ${selectedLocation === area.locationId ? "bg-white/40 text-gray-800" : "bg-white/10 text-gray-800"
                  }`}
              >
                {area.name}
              </button>
            ))}
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
          {selectedLocation? (

          <div className={`flex flex-wrap justify-between gap-4 mb-6 ${isDataStale ? "border-4 border-red-500 animate-pulse" : ""}`}>
            {/* Nhiệt độ */}
            <div className="flex-1 min-w-[200px] bg-white/80 rounded-lg p-4 flex flex-col items-center">
              <div className="text-xl font-semibold mb-1">Nhiệt độ</div>
              <div className="text-3xl font-bold">{temperatureChartData[selectedLocation]?.slice(-1)[0]?.temp ?? "--"}°C</div>
              <div className="text-sm text-gray-600 mt-1">Temperature</div>
            </div>

            {/* Độ ẩm không khí */}
            <div className="flex-1 min-w-[200px] bg-white/80 rounded-lg p-4 flex flex-col items-center">
              <div className="text-xl font-semibold mb-1">Độ ẩm</div>
              <div className="text-3xl font-bold">{humidityChartData[selectedLocation]?.slice(-1)[0]?.humidity ?? "--"}%</div>
              <div className="text-sm text-gray-600 mt-1">Air humidity</div>
            </div>

            {/* Độ ẩm đất */}
            <div className="flex-1 min-w-[200px] bg-white/80 rounded-lg p-4 flex flex-col items-center">
              <div className="text-xl font-semibold mb-1">Độ ẩm đất</div>
              <div className="text-3xl font-bold">{soilChartData[selectedLocation]?.slice(-1)[0]?.soil ?? "--"}%</div>
              <div className="text-sm text-gray-600 mt-1">Soil moisture</div>
            </div>
          </div>
          ) : (
          <div className="text-center py-6 text-gray-600">Chưa chọn khu vực</div>
          )}


          {/* Biểu đồ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div onClick={() => openChartModal("temperature")} className="relative cursor-pointer bg-white/80 rounded-lg p-4">
              {isDataStale && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-70 text-white z-10">
                  Dữ liệu không được cập nhật trong 30 giây!
                </div>
              )}
              <div className="text-lg font-semibold mb-2">Nhiệt độ</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={temperatureChartData[selectedLocation] || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={[currentTime.getTime() - 60000, currentTime.getTime()]}
                    tickFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip labelFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} />
                  <Legend />
                  <Line type="monotone" dataKey="temp" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div onClick={() => openChartModal("humidity")} className="relative cursor-pointer bg-white/80 rounded-lg p-4">
              {isDataStale && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-70 text-white z-10">
                  Dữ liệu không được cập nhật trong 30 giây!
                </div>
              )}
              <div className="text-lg font-semibold mb-2">Độ ẩm không khí</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={humidityChartData[selectedLocation] || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={[currentTime.getTime() - 60000, currentTime.getTime()]}
                    tickFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip labelFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} />
                  <Legend />
                  <Line type="monotone" dataKey="humidity" stroke="#82ca9d" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div onClick={() => openChartModal("soil")} className="relative cursor-pointer bg-white/80 rounded-lg p-4">
              {isDataStale && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-70 text-white z-10">
                  Dữ liệu không được cập nhật trong 30 giây!
                </div>
              )}
              <div className="text-lg font-semibold mb-2">Độ ẩm đất</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={soilChartData[selectedLocation] || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={[currentTime.getTime() - 60000, currentTime.getTime()]}
                    tickFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip labelFormatter={time => new Date(time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} />
                  <Legend />
                  <Line type="monotone" dataKey="soil" stroke="#FF8042" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div >

      {/* Modal thêm khu vực */}
      {
        showModal && (
          <div onClick={() => setShowModal(false)} className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-lg w-80">
              <h2 className="text-lg font-bold mb-4">Thêm khu vực</h2>
              <div className="mb-2">
                <label className="block text-sm">Tên khu vực</label>
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
        )
      }

      {/* Modal danh sách areas */}
      {showAreaList && (
        <div onClick={() => setShowAreaList(false)} className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">Danh sách khu vực</h2>
            <table className="w-full text-left mb-4">
              <thead>
                <tr>
                  <th className="border-b py-2">Khu vực</th>
                  <th className="border-b py-2">Hoạt động</th>
                </tr>
              </thead>
              <tbody>
                {locationData.locations.map((location) => (
                  <tr key={location.locationId}>
                    <td className="border-b py-2">{location.name}</td>
                    <td className="border-b py-2 space-x-2">
                      <button
                        onClick={() => handleEditArea(location.locationId)}
                        className="px-2 py-1 bg-green-500 text-white rounded"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleDeleteArea(location.locationId)}
                        className="px-2 py-1 bg-red-500 text-white rounded"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <button onClick={handleCloseAreaList} className="px-4 py-1 bg-gray-300 rounded">
                ✖
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal chỉnh sửa area */}
      {
        editingArea !== null && (
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
              <div className="flex justify-end space-x-2">
                <button onClick={() => handleSaveEditArea()} className="px-4 py-1 bg-blue-500 text-white rounded">Save</button>
                <button onClick={handleCancelEditArea} className="px-4 py-1 bg-gray-300 rounded">Cancel</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal confirm delete */}
      {showConfirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-96 text-center">
            <h2 className="text-lg font-bold mb-4">Xác nhận xóa</h2>
            <p>Bạn có chắc chắn muốn xóa khu vực này không?</p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={confirmDeleteArea}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Xóa
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteMessage && (
        <div className="fixed bottom-5 right-5 bg-gray-800 text-white px-4 py-2 rounded">
          {deleteMessage}
          <button onClick={closeDeleteMessage} className="ml-2 text-yellow-300">✖</button>
        </div>
      )}


      {/* Modal biểu đồ với bộ lọc thời gian */}
      {
        showChartModal && (
          <div onClick={() => setShowChartModal(false)} className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-lg w-11/12 max-w-3xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {selectedChart === "temperature" ? "Temperature"
                    : selectedChart === "humidity" ? "Humidity"
                      : "Soil Moisture"} Chart
                </h2>
                <button onClick={() => setShowChartModal(false)} className="px-4 py-1 bg-gray-300 rounded">✖</button>
              </div>

              {/* New Date Picker for fixed date search */}
              <div className="mb-4 flex items-center">
                <label className="mr-2">Chọn ngày:</label>
                <input
                  type="date"
                  value={fixedDate}
                  onChange={(e) => setFixedDate(e.target.value)}
                  className="border p-1 rounded"
                />
                {fixedDate && (
                  <button onClick={() => setFixedDate("")} className="ml-2 px-3 py-1 bg-gray-300 rounded">
                    Clear
                  </button>
                )}
              </div>

              {/* New search range with datetime-local */}
              <div className="mb-4 flex flex-col gap-2">
                <div className="flex items-center">
                  <label className="mr-2">Chọn thời gian bắt đầu:</label>
                  <input
                    type="datetime-local"
                    value={searchStart}
                    onChange={(e) => setSearchStart(e.target.value)}
                    className="border p-1 rounded"
                  />
                </div>
                <div className="flex items-center">
                  <label className="mr-2">Chọn thời gian kết thúc:</label>
                  <input
                    type="datetime-local"
                    value={searchEnd}
                    onChange={(e) => setSearchEnd(e.target.value)}
                    className="border p-1 rounded"
                  />
                </div>
                {(searchStart !== "" || searchEnd !== "") && (
                  <button onClick={() => { setSearchStart(""); setSearchEnd(""); }}
                    className="ml-2 px-3 py-1 bg-gray-300 rounded">
                    Clear Range
                  </button>
                )}
              </div>

              {/* Bộ lọc thời gian */}
              <div className="flex space-x-2 mb-4">
                {[1, 3, 7, 30].map((day) => (
                  <button
                    key={day}
                    onClick={() => setTimeFilter(day)}
                    className={`px-3 py-1 rounded ${timeFilter === day ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}
                  >
                    {day === 1 ? "24 giờ gần nhất" : `${day} ngày trước`}
                  </button>
                ))}
              </div>

              {/* Biểu đồ */}
              <div className="bg-white/80 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getFilteredChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={
                        searchStart !== "" && searchEnd !== ""
                          ? [new Date(searchStart).getTime(), new Date(searchEnd).getTime()]
                          : fixedDate !== ""
                            ? [new Date(fixedDate).setHours(0, 0, 0, 0), new Date(fixedDate).setHours(23, 59, 59, 999)]
                            : [currentTime.getTime() - timeFilter * 24 * 60 * 60 * 1000, currentTime.getTime()]
                      }
                      tickFormatter={(time) => new Date(time).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(time) => new Date(time).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
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
        )
      }


    </div >
  );
}
