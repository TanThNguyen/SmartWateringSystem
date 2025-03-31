import { useEffect, useState } from "react";

import { LONG_DATE_FORMAT, TIME_FORMAT } from "../../types/date.type";
import { configurationApi } from "../../axios/configuration.api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./setting.scss";

import { 
    // ConfigurationCreateType, 
    // ConfigurationUpdateType, 
    // ConfigurationDeleteType, 
    ConfigurationQueryType, 
    // ConfigurationFilterType,
    ConfigurationPaginatedType,
    ConfigurationDetailType,
    
    DeviceType,
} from "../../types/configuration.type";



  

const SettingPage = () => {

    const [currentPage, setCurrentPage] = useState(1);




    const [first, setFirst] = useState<number>(0);
    const [rows, setRows] = useState<number>(10);
    
    const [currentTime, setCurrentTime] = useState(new Date());
    const dateString = currentTime.toLocaleDateString("vi-VN", LONG_DATE_FORMAT);
    const timeString = currentTime.toLocaleTimeString("vi-VN", TIME_FORMAT);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [deviceTypeFilter, setDeviceTypeFilter] = useState<DeviceType | 'ALL'>('ALL');
    const [configurations, setConfigurations] = useState<ConfigurationPaginatedType | null>(null);

    
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

    useEffect(() => {
        fetchConfigurationData();
    }, [currentPage,deviceTypeFilter]);

    useEffect(() => {
        const interval = setInterval(() => {
              setCurrentTime(new Date());
            }, 60000);
            return () => clearInterval(interval);
    }, []);

    if (loading) return <p>Loading...</p>;



    return (
        <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center p-6 relative flex flex-col justify-center items-center">
          {/* Top Bar */}
          <div className="bg-black/70 w-4/5 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg relative z-10 backdrop-blur-md">
            <div>
              <h1 className="text-xl font-bold">Welcome Farm, User!</h1>
                <div className="text-sm font-medium">{dateString}</div>
                <div className="text-sm">{timeString}</div>
            </div>
              {/* Thanh tìm kiếm */}
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
            </select>



            <button className="bg-green-600 text-white px-4 py-2 rounded-lg h-10">Add Setting</button>
          </div>
          






            {/* Data Table */}
            <div className="w-4/5 mt-6 p-4 bg-white/30 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden relative z-0">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b">
                    <th className="p-2">Name</th>
                    <th className="p-2">Value</th>
                    <th className="p-2">Device Type</th>
                    <th className="p-2">Last Update</th>
                    </tr>
                </thead>
                <tbody>
                    {configurations?.configurations?.map((item : ConfigurationDetailType, index) => (
                    <tr key={index} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.value}</td>
                        <td className="p-2">{item.deviceType}</td>
                         <td className="p-2">{new Date(item.lastUpdated).toLocaleString()}</td> 
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            <div className="mt-4 flex gap-2"> 
                {/* Nút Previous */}
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

                {/* Hiển thị trang hiện tại */}
                <span className="text-white">
                    Page {currentPage} of {configurations?.lastPage ?? "?"}
                </span>

                {/* Nút Next */}
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









          
        </div>

        
      );
    };



export default SettingPage;
