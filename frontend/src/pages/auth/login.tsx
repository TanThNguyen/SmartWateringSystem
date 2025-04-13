import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaGoogle, FaApple } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { authApi } from "../../axios/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated && token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Vui lòng nhập email và mật khẩu!");
      return;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      toast.error("Email không hợp lệ!");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (response.success) {
        const now = new Date().getTime();
        const expiration = now + 6 * 60 * 60 * 1000;
        const { accessToken, role, name } = response.data;
        console.log(response);
        localStorage.setItem("token", JSON.stringify(accessToken));
        localStorage.setItem("name", JSON.stringify(name));
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("role", role);
        if (role === "ADMIN") {
          localStorage.setItem("adminLogin", JSON.stringify({ status: true, expiration }));
        } else if (role === "GARDENER") {
          localStorage.setItem("gardenerLogin", JSON.stringify({ status: true, expiration }));
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("isAuthenticated");
          toast.error("Vai trò không hợp lệ");
          setLoading(false);
          return;
        }



        navigate("/dashboard");
        toast.success("Đăng nhập thành công!");
      } else {
        toast.error(response.data.message || "Đăng nhập thất bại!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi không xác định, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 flex flex-col justify-center px-16">
        <h1 className="text-3xl font-bold">Chào mừng bạn!</h1>
        <p className="text-gray-500 mt-2">Nhập thông tin để truy cập</p>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="mt-6">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="Nhập email"
              className="w-full border px-4 py-2 rounded mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mt-4 relative">
            <label className="block text-sm font-medium">Mật khẩu</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              className="w-full border px-4 py-2 rounded mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </span>
            {/* <a href="#" className="text-sm text-blue-600 mt-3 block">Quên mật khẩu?</a> */}

          </div>

          {/* <div className="mt-4 flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Ghi nhớ trong 30 ngày</span>
          </div> */}

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded mt-6 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Đăng nhập"}
          </button>
        </form>
      </div>

      <div className="w-1/2 h-full">
        <img src="/src/assets/image.png" alt="Login Image" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
