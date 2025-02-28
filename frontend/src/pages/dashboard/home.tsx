import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const [username, setUsername] = useState("User");
  const navigate = useNavigate();

  useEffect(() => {
    // Giả sử lấy tên từ localStorage sau khi đăng nhập
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/5 bg-white shadow-lg p-4">
        <h2 className="text-xl font-bold mb-4">Dashboard</h2>
        <ul>
          <li className="p-2 hover:bg-gray-200 cursor-pointer">🏠 Trang chủ</li>
          <li className="p-2 hover:bg-gray-200 cursor-pointer">👤 Hồ sơ</li>
          <li className="p-2 hover:bg-gray-200 cursor-pointer">⚙️ Cài đặt</li>
          <li className="p-2 text-red-600 hover:bg-red-100 cursor-pointer" onClick={handleLogout}>
            🚪 Đăng xuất
          </li>
        </ul>
      </div>

      {/* Nội dung chính */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Chào mừng, {username}!</h1>
        <p className="text-gray-600 mt-2">Đây là trang Dashboard của bạn.</p>
      </div>
    </div>
  );
}
