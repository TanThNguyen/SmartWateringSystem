import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SettingPage() {
  const [username, setUsername] = useState("User");
  const navigate = useNavigate();

  // Lấy username từ localStorage (nếu có)
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  // Danh sách thiết bị cho hệ thống tưới nước tự động (ví dụ)
  const devices = [
    {
      id: 1,
      name: "Soil Moisture Sensor",
      info: "Độ ẩm đất: 45%",
      icon: "🌱",
    },
    {
      id: 2,
      name: "Temperature Sensor",
      info: "Nhiệt độ không khí: 28°C",
      icon: "🌡️",
    },
    {
      id: 3,
      name: "Water Pump",
      info: "Trạng thái: OFF",
      icon: "💧",
    },
    {
      id: 4,
      name: "Water Valve A",
      info: "Độ mở van: 50%",
      icon: "🚰",
      hasSlider: true, // Có thanh trượt điều chỉnh độ mở
    },
    {
      id: 5,
      name: "pH Sensor",
      info: "pH: 6.5",
      icon: "🧪",
    },
    {
      id: 6,
      name: "EC Sensor",
      info: "EC: 1.2 mS/cm",
      icon: "🔬",
    },
    {
      id: 7,
      name: "Rain Sensor",
      info: "Mưa: Không",
      icon: "🌧️",
    },
    {
      id: 8,
      name: "Fertilizer Mixer",
      info: "Trạng thái: Idle",
      icon: "⚗️",
    },
    {
      id: 9,
      name: "Flow Meter",
      info: "Lưu lượng: 0 L/min",
      icon: "🔃",
    },
    {
      id: 10,
      name: "Humidity Sensor",
      info: "Độ ẩm không khí: 60%",
      icon: "💦",
    },
    {
      id: 11,
      name: "Irrigation Timer",
      info: "Thời gian tưới: 30 phút",
      icon: "⏲️",
      hasSlider: true, // Có thể điều chỉnh thời lượng tưới
    },
  ];

  return (
    <div className="container">
      {/* Sidebar bên trái (bỏ comment nếu muốn hiển thị) */}
      {/*
      <div className="sidebar">
        <ul>
          <li onClick={() => navigate("/")}>🏠 Home</li>
          <li onClick={() => navigate("/setting")}>⚙️ Setting</li>
          <li onClick={() => navigate("/history")}>🕒 History</li>
          <li onClick={() => alert("More...")}>➕ More</li>
        </ul>
      </div>
      */}

      {/* Nội dung chính */}
      <div className="mainContent">
        {/* Thanh trên cùng */}
        <div className="topBar">
          <div className="logoCircle">1</div>
          <div className="titleAndTime">
            <div className="welcomeText">Welcome Farm, {username}!</div>
            <div className="dateTime">
              <div>10:00 AM</div>
              <div>Sunday, 17 Sept 2023</div>
            </div>
          </div>
        </div>

        {/* Khu vực hiển thị các thiết bị */}
        <div className="deviceContainer">
          {devices.map((device) => (
            <div key={device.id} className="deviceCard">
              <div className="deviceIcon">{device.icon}</div>
              <div className="deviceInfo">
                <h3>{device.name}</h3>
                <p>{device.info}</p>
                {device.hasSlider && (
                  <div className="sliderRow">
                    <input type="range" min="0" max="100" defaultValue="50" />
                    <span>50%</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thêm nút Add device (tùy ý) */}
          <div className="deviceCard addDeviceCard">
            <button onClick={() => alert("Add new device!")}>+ Add device</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Toàn màn hình, đặt ảnh nền */
        .container {
          background: url("https://images.unsplash.com/photo-1562075219-5356a05c8db5?fit=crop&w=1600&q=80")
            no-repeat center center fixed;
          background-size: cover;
          min-height: 100vh;
          font-family: Arial, sans-serif;
          display: flex;
        }

        /* (Tuỳ chọn) Sidebar bên trái */
        .sidebar {
          width: 60px;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 20px;
        }
        .sidebar ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .sidebar li {
          color: #fff;
          margin: 20px 0;
          cursor: pointer;
          text-align: center;
          font-size: 1.2rem;
        }
        .sidebar li:hover {
          color: #ddd;
        }

        /* Khu vực nội dung chính */
        .mainContent {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
        }

        /* Thanh trên cùng */
        .topBar {
          width: 90%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(8px);
          padding: 10px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .logoCircle {
          width: 40px;
          height: 40px;
          background-color: #e74c3c;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.1rem;
          margin-right: 10px;
        }
        .titleAndTime {
          flex: 1;
          margin-left: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .welcomeText {
          color: #fff;
          font-size: 1.3rem;
          font-weight: 600;
        }
        .dateTime {
          color: #fff;
          font-size: 0.9rem;
          line-height: 1.2;
        }

        /* Khu vực chứa các thiết bị */
        .deviceContainer {
          /* 3 cột cố định */
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;

          /* Thanh cuộn dọc khi thiết bị nhiều */
          max-height: 500px; /* Chiều cao tối đa, bạn tùy chỉnh theo ý */
          overflow-y: auto;

          /* Kích thước ngang co theo chiều rộng 90% */
          width: 90%;
        }

        /* Card mỗi thiết bị */
        .deviceCard {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          padding: 15px;
          display: flex;
          flex-direction: row;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          color: #333;
        }
        .deviceIcon {
          font-size: 2rem;
          margin-right: 10px;
        }
        .deviceInfo h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #333;
        }
        .deviceInfo p {
          margin: 4px 0 0;
          color: #555;
          font-size: 0.9rem;
        }
        .sliderRow {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
        }
        .sliderRow input[type="range"] {
          flex: 1;
        }
        .sliderRow span {
          min-width: 30px;
          text-align: right;
        }

        /* Card Add device */
        .addDeviceCard {
          justify-content: center;
          align-items: center;
        }
        .addDeviceCard button {
          background: #3498db;
          color: #fff;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .addDeviceCard button:hover {
          background: #2980b9;
        }

        /* Responsive: nếu muốn 3 cột cố định cho mọi màn hình, bỏ 2 media query dưới.
           Nếu vẫn muốn giao diện linh hoạt, giữ lại chúng: */
        @media (max-width: 768px) {
          .deviceContainer {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .deviceContainer {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
