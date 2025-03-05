import { useEffect, useState } from "react";

export default function SettingPage() {
  const [username, setUsername] = useState("User");

  // Lấy username từ localStorage (nếu có)
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  // Dữ liệu mô phỏng cho bảng "Setting"
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
      {/* Thanh trên cùng chứa logo, tiêu đề, thời gian, nút Add */}
      <div className="topBar">
        <div className="logoCircle">1</div>

        <div className="titleAndTime">
          {/* Thay "Welcome Farm, VNT!" bằng nội dung bạn muốn */}
          <div className="welcomeText">Welcome Farm, {username}!</div>
          <div className="dateTime">
            <div>10:00 AM</div>
            <div>Sunday, 17 April 2023</div>
          </div>
        </div>

        <button className="addButton">Add Setting</button>
      </div>

      {/* Khung chứa bảng */}
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
          <li>4</li>
          <li>5</li>
        </ul>
      </div> */}

      <style jsx>{`
        /* Toàn màn hình, đặt ảnh nền */
        .container {
          /* Thay link ảnh nền phù hợp với bạn */
          background: url("https://images.unsplash.com/photo-1562075219-5356a05c8db5?fit=crop&w=1600&q=80")
            no-repeat center center fixed;
          background-size: cover;
          min-height: 100vh;
          padding: 20px;
          font-family: Arial, sans-serif;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
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

        /* Logo hình tròn có số 1 */
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

        /* Nút Add Setting */
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

        /* Khung chứa bảng */
        .tableContainer {
          width: 90%;
          background: rgba(255, 255, 255, 0.652);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          overflow-y: auto;
          height: 500px; 
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        /* Bảng Setting */
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
        }
        .settingTable thead th {
          font-weight: 600;
          color: #333;
        }
        .settingTable tbody tr:hover {
          background-color: #f1f1f1;
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
          .topBar {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .titleAndTime {
            margin-left: 0;
          }
          .tableContainer {
            height: auto; /* Để bảng tự co cho màn hình nhỏ */
            max-height: 400px;
          }
        }
      `}</style>
    </div>
  );
}
