import { useState, useEffect } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { FaHome, FaCog, FaSignOutAlt, FaUsers, FaHistory, FaShower, FaBell } from "react-icons/fa";
import { notiApi } from "../axios/notification.api";

export default function DashboardLayout() {
  const [username, setUsername] = useState("User");
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  // Lấy username từ localStorage (nếu có)
  useEffect(() => {
    fetchUnreadNotiCount();
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  const fetchUnreadNotiCount = async () => {
    const response = await notiApi.getUnreadCount();
    console.log(response);
    if (response?.success) {
      setUnreadNotifications(response?.data);
    }
  };

  useEffect(() => {
    if (showLogoutModal) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowLogoutModal(false);
        }
      };
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [showLogoutModal]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div
      className="relative h-screen w-screen bg-cover bg-center "
      style={{ backgroundImage: "url('/src/assets/bg.jpg')" }}
    >
      {/* Sidebar */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 flex flex-col gap-6 bg-white/20 backdrop-blur-sm p-4 rounded-r-lg  z-50">
        <NavLink
          to="home"
          className={({ isActive }) =>
            isActive
              ? "text-blue-500 transition-colors duration-200 ease-in-out"
              : "text-white hover:text-gray-400 transition-colors duration-200 ease-in-out"
          }
        >
          <FaHome size={24} />
        </NavLink>
        <NavLink
          to="device"
          className={({ isActive }) =>
            isActive
              ? "text-blue-500 transition-colors duration-200 ease-in-out"
              : "text-white hover:text-gray-400 transition-colors duration-200 ease-in-out"
          }
        >
          <FaShower size={24} />
        </NavLink>
        <NavLink
          to="usermanager"
          className={({ isActive }) =>
            isActive
              ? "text-blue-500 transition-colors duration-200 ease-in-out"
              : "text-white hover:text-gray-400 transition-colors duration-200 ease-in-out"
          }
        >
          <FaUsers size={24} />
        </NavLink>
        <NavLink
          to="history"
          className={({ isActive }) =>
            isActive
              ? "text-blue-500 transition-colors duration-200 ease-in-out"
              : "text-white hover:text-gray-400 transition-colors duration-200 ease-in-out"
          }
        >
          <FaHistory size={24} />
        </NavLink>
        <NavLink
          to="setting"
          className={({ isActive }) =>
            isActive
              ? "text-blue-500 transition-colors duration-200 ease-in-out"
              : "text-white hover:text-gray-400 transition-colors duration-200 ease-in-out"
          }
        >
          <FaCog size={24} />
        </NavLink>
        <button
          onClick={handleLogout}
          className="text-white hover:text-gray-400 transition-colors duration-200 ease-in-out"
        >
          <FaSignOutAlt size={24} />
        </button>
      </div>

      <main className='flex w-full flex-1 items-center justify-center z-10'>
        <div className='w-full max-w-7xl'>
          <div className="absolute top-4 left-4 flex items-center bg-white/80 backdrop-blur-sm p-3 rounded-md shadow-md text-sm text-gray-800">
            <div className="relative">
              <FaBell size={24} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </div>
            <span className="ml-2 font-semibold">
              Kiểm tra bơm
            </span>
          </div>
          <Outlet />
        </div>
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-md shadow-md text-center">
            <p className="mb-4">Bạn có chắc chắn muôn thoát không?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 bg-gray-300 rounded-md">Hủy</button>
              <button onClick={confirmLogout} className="px-4 py-2 bg-blue-500 text-white rounded-md">Có</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
