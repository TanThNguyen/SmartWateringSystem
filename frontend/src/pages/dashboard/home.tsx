import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { LONG_DATE_FORMAT } from  "../../types/date.type";
import { TIME_FORMAT } from  "../../types/date.type";




export default function DashboardPage() {
  const [username, setUsername] = useState("User");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Lấy username từ localStorage (nếu có)
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

//  cập nhật thời gian 
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date()); 
    }, 1000); //1000ms = 1 giây

    return () => clearInterval(interval);
  }, []);

 


  const dateString = currentTime.toLocaleDateString("vi-VN", LONG_DATE_FORMAT);

  const timeString = currentTime.toLocaleTimeString("vi-VN", TIME_FORMAT);




  return (
    <div>
      {/* bổ sung thêm thông tin sau */}
      {/* Thông báo */}
      <div className="absolute top-4 left-4 flex items-center bg-white/80 backdrop-blur-sm p-3 rounded-md shadow-md text-sm text-gray-800">
        <div className="relative">
          <FaBell size={24} />
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">

          </span>
        </div>

        {/* Nội dung thông báo */}
        
        <span className="ml-2 font-semibold">
          Hoạt động bất thường, kiểm tra bơm
        </span>
      </div>

      
      <div className="absolute top-4 right-4 text-white">
        <div className="text-lg font-semibold mb-1 text-center">
          Chào mừng {username}!
        </div>
        <div className="text-sm text-right">
          {dateString}
          <br />
          {timeString}
        </div>
      </div>



      {/* thông tin, đợi cập nhật */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/30 backdrop-blur-md rounded-xl w-4/5 max-w-5xl p-6 flex flex-col gap-6">
          {/* Khu vực hiển thị thông tin thời tiết / thiết bị */}
          <div className="flex justify-between gap-4">
            <div className="flex-1 bg-white/80 rounded-lg p-4 flex flex-col items-center">
              <div className="text-xl font-semibold mb-1">Trời nắng</div>
              <div className="text-3xl font-bold">30°C</div>
              <div className="text-sm text-gray-500 mt-1">Nhiệt độ ngoài trời</div>
            </div>
            <div className="flex-1 bg-white/80 rounded-lg p-4 flex flex-col items-center">
              <div className="text-xl font-semibold mb-1">Độ ẩm</div>
              <div className="text-3xl font-bold">60%</div>
              <div className="text-sm text-gray-500 mt-1">Độ ẩm bình thường</div>
            </div>   



            {/* thông tin thiết bị đợi cập nhật */}
            {/* <div className="flex-1 bg-white/80 rounded-lg p-4 flex flex-col items-center">
              <div className="text-xl font-semibold mb-1">Air Conditioner</div>
              <div className="text-3xl font-bold">16°C</div>
              <div className="text-sm text-gray-500 mt-1">Cooling mode</div>
            </div> */}
          </div>


        </div>
      </div>
    </div>
  );
}
