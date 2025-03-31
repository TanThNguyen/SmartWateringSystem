import { useState } from "react";
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
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-gray-500 mt-2">Enter your credentials to access your account</p>

        <div className="mt-6">
          <label className="block text-sm font-medium">Email address</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full border px-4 py-2 rounded mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mt-4 relative">
          <label className="block text-sm font-medium">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="w-full border px-4 py-2 rounded mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </span>
          <a href="#" className="text-sm text-blue-600 mt-3 block">Forgot password?</a>
        </div>

        <div className="mt-4 flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm">Remember for 30 days</span>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-green-700 text-white py-2 rounded mt-6 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="text-center text-sm text-gray-400 mt-4">Or</div>

        <div className="flex gap-4 mt-4">
          <button className="flex-1 border flex items-center justify-center py-2 rounded">
            <FaGoogle className="mr-2" /> Sign in with Google
          </button>
          <button className="flex-1 border flex items-center justify-center py-2 rounded">
            <FaApple className="mr-2" /> Sign in with Apple
          </button>
        </div>
      </div>

      <div className="w-1/2 h-full">
        <img src="/src/assets/image.png" alt="Login Image" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
