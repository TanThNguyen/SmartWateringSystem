import { useState, useEffect } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { FaHome, FaCog, FaSignOutAlt, FaUsers, FaHistory, FaShower } from "react-icons/fa";

export default function DashboardLayout() {
  const [username, setUsername] = useState("User");
  const navigate = useNavigate();

  // Lấy username từ localStorage (nếu có)
  useEffect(() => {
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
			<Outlet />
		</div>
	</main>
    </div>
  );
}
