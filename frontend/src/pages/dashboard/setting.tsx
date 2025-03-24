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

  const [settingsData] = useState([
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
    {
      id: "00110",
      name: "MoistureXuan A",
      value: 20,
      location: "A",
      lastUpdate: "11:09:05 23012025",
    },
  ]);

  return (
    <div className="container">
      {/* Sidebar bên trái (icon minh họa) */}
      {/* <div className="sidebar">
        <ul>
          <li onClick={() => navigate("/")}>🏠 Home</li>
          <li onClick={() => navigate("/setting")}>⚙️ Setting</li>
          <li onClick={() => navigate("/history")}>🕒 History</li>
          <li onClick={() => alert("More...")}>➕ More</li>
        </ul>
      </div> */}

      {/* Nội dung chính */}
      <div className="mainContent">
        {/* Thanh trên cùng chứa logo, tiêu đề, thời gian */}
        <div className="topBar">
          <div className="logoCircle">1</div>

          <div className="titleAndTime">
            <div className="welcomeText">Welcome Farm, {username}!</div>
            <div className="dateTime">
              <div>10:00 AM</div>
              <div>Sunday, 17 Sept 2023</div>
            </div>
          </div>

        <button className="addButton">Add Setting</button>
      </div>

        {/* Khung chứa bảng (frosted glass) */}
        <div className="tableContainer">
        <table className="settingTable">
          <thead>
            <tr>
              {/* Tùy chỉnh tên cột theo ý bạn */}
              <th>Name</th>
              <th>Value</th>
              <th>Location</th>
              <th>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {settingsData.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.value}</td>
                <td>{item.location}</td>
                <td>{item.lastUpdate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        {/* Thanh phân trang (giả lập) */}
        {/* <div className="pagination">
          <ul>
            <li className="active">1</li>
            <li>2</li>
            <li>3</li>
          </ul>
        </div> */}
      </div>

      <style jsx>{`
        /* Toàn màn hình, đặt ảnh nền */
        .container {
          background: url("https://images.unsplash.com/photo-1562075219-5356a05c8db5?fit=crop&w=1600&q=80")
            no-repeat center center fixed;
          background-size: cover;
          /* padding: 20px; */
          min-height: 100vh;
          font-family: Arial, sans-serif;
          display: flex; /* để sidebar và mainContent ngang hàng */
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

        /* Logo hình tròn có số 1 (thông báo) */
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

        /* Vùng chứa Welcome + Thời gian */
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

        .addButton {
          background-color: #2ecc71;
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          white-space: nowrap;
        }
        .addButton:hover {
          background-color: #27ae60;
        }

        /* Khung chứa bảng (hiệu ứng kính mờ) */
        .tableContainer {
          width: 90%;
          background: rgba(255, 255, 255, 0.652);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          overflow-y: auto;
          height: 550px; 
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        /* Bảng setting */
        .settingTable {
          width: 100%;
          border-collapse: collapse;
        }
        .settingTable thead {
          background-color: #f7f7f7;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .settingTable th,
        .settingTable td {
          padding: 12px 15px;
          border-bottom: 1px solid #e0e0e0;
          text-align: left;
          color: #333;
        }
        .settingTable thead th {
          font-weight: 600;
          color: #333;
        }
        .settingTable tbody tr:hover {
          background-color: rgba(255, 255, 255, 0.4);
        }

        /* Phân trang (giả lập) */
        .pagination {
          width: 90%;
          margin-top: 10px;
          display: flex;
          justify-content: center;
        }
        .pagination ul {
          list-style: none;
          display: flex;
          gap: 10px; 
          padding: 0;
        }
        .pagination li {
          background: rgba(0, 0, 0, 0.2);
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          color: #fff;
        }
        .pagination li:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        .pagination .active {
          background: #3498db;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar {
            display: none; /* Ẩn sidebar trên màn hình nhỏ nếu muốn */
          }
          .topBar {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .tableContainer {
            height: auto; /* Cho bảng tự co */
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
