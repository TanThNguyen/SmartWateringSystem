import { useEffect, useState } from "react";

import { LONG_DATE_FORMAT, TIME_FORMAT } from "../../types/date.type";
import { configurationApi } from "../../axios/configuration.api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./setting.scss";
import PopupModal from "../../layout/popupmodal";
import { locationApi } from "../../axios/location.api";
import { FindAllLocationsType, InfoLocationType } from "../../types/location.type";

import { 
    ConfigurationCreateType, 
    // ConfigurationUpdateType, 
    //ConfigurationDeleteType, 
    ConfigurationQueryType, 
    // ConfigurationFilterType,
    ConfigurationPaginatedType,
    ConfigurationDetailType,
    
    DeviceType,
} from "../../types/configuration.type";



  

const SettingPage = () => {

    const [currentPage, setCurrentPage] = useState(1);
    const [username, setUsername] = useState("AAAA");


    const [first, setFirst] = useState<number>(0);
    const [rows, setRows] = useState<number>(10);
    
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
    deviceType: "MOISTURE_SENSOR", // Giá trị mặc định
    });

    const [locations, setLocations] = useState<FindAllLocationsType | null>(null);


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
              setFirst((response.currentPage - 1) * rows);

              setConfigurations(response); 
          } catch (err) {
              toast.error("Lỗi khi tải danh sách cấu hình");
          } finally {
              setLoading(false);
          }
      };



      const handleDeleteConfigurations = async () => {
      
        try {
          // Tạo danh sách configId từ deleteConfig
          const deleteRequests = deleteConfig.map((id) => ({ configId: id }));
      
          // Gọi API cho từng phần tử trong mảng
          await Promise.all(deleteRequests.map((data) => configurationApi.deleteConfiguration(data)));
      
          toast.success("Xóa cấu hình thành công!");
          
          // Cập nhật lại danh sách sau khi xóa
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
    }, [currentPage,deviceTypeFilter]);

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

    if (loading) return <p>Loading...</p>;



    return (
        <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center p-6 relative flex flex-col justify-center items-center">
          <div className="bg-black/70 w-4/5 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg relative z-10 backdrop-blur-md">
            <div>
                <h1 className="text-xl font-bold">Welcome Farm, {username}!</h1>
                <div className="text-sm font-medium">{dateString}</div>
                <div className="text-sm">{timeString}</div>
            </div>
            
            <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchConfigurationData();
                  }
                }}
                className="bg-white text-black rounded px-3 py-1 w-1/5 h-10"
            />

            <select
                value={deviceTypeFilter}
                onChange={(e) => {
                setDeviceTypeFilter(e.target.value as DeviceType | 'ALL');
                }}
                className="bg-white text-black rounded px-3 py-1 w-1/5 h-10"
            >
                <option value="ALL">Tất cả thiết bị</option>
                <option value="MOISTURE_SENSOR">MOISTURE_SENSOR</option>
                <option value="DHT20_SENSOR">DHT20_SENSOR</option>
                <option value="PUMP">PUMP</option>
                <option value="LCD">LCD</option>
                <option value="FAN">FAN</option>
                <option value="LED">LED</option>
            </select>


            <button
                onClick={handleDeleteConfigurations}
                className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                disabled={deleteConfig.length === 0}
            >
                Xóa
            </button>

            <button onClick={() => setShowAddForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg">
                Thêm
            </button>
          </div>
          






            {/* Bảng  */}
            <div className="w-4/5 mt-6 p-4 bg-white/30 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden relative z-0">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b">
                    <th className="p-2">
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
                    <th className="p-2">Name</th>
                    <th className="p-2">Value</th>
                    <th className="p-2">Device Type</th>
                    <th className="p-2">Last Update</th>
                </tr>
                </thead>
                <tbody>
                {configurations?.configurations?.map((item: ConfigurationDetailType, index) => (
                    <tr key={index} className="border-b">
                    <td className="p-2">
                        <input
                        type="checkbox"
                        checked={deleteConfig.includes(item.configId)}
                        onChange={() => handleCheckboxChange(item.configId)}
                        />
                    </td>
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.value}</td>
                    <td className="p-2">{item.deviceType}</td>
                    <td className="p-2">{new Date(item.lastUpdated).toLocaleString()}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>

            
            {/* Chia  */}
            <div className="mt-4 flex gap-2"> 
                <button 
                    className="px-3 py-1 bg-gray-800 text-white rounded-md disabled:opacity-50" 
                    onClick={() => {
                        if (configurations?.prevPage !== null && configurations?.prevPage !== undefined) {
                            setCurrentPage(configurations.prevPage);
                            setFirst((configurations.prevPage - 1) * rows);

                        }
                    }} 
                    disabled={configurations?.prevPage === null || configurations?.prevPage === undefined}
                >
                    Previous
                </button>

                <span className="text-white">
                    Page {currentPage} of {configurations?.lastPage ?? "?"}
                </span>

                <button 
                    className="px-3 py-1 bg-gray-800 text-white rounded-md disabled:opacity-50" 
                    onClick={() => {
                        if (configurations?.nextPage) {
                            setCurrentPage(configurations.nextPage);
                            setFirst((configurations.nextPage - 1) * rows);
                        }
                    }}
                    disabled={configurations?.nextPage === null || configurations?.nextPage === undefined}
                >
                    Next
                </button>
            </div>


            
            {/* Form thêm*/}
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
                        className="w-full p-2 border rounded-lg focus:ring focus:ring-green-400"
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
                        className="w-full p-2 border rounded-lg focus:ring focus:ring-green-400"
                        placeholder="Nhập giá trị"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium">Khu vực</label>
                        <select
                            name="locationId"
                            value={newConfig.locationId}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-lg focus:ring focus:ring-green-400"
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
                        className="w-full p-2 border rounded-lg focus:ring focus:ring-green-400"
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
