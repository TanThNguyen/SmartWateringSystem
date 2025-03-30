import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./device.scss";

export default function HistoryPage() {
  const [username, setUsername] = useState("User");
  const navigate = useNavigate();

  // Lấy username từ localStorage (nếu có)
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  // Dữ liệu mô phỏng cho bảng "History"
  const [historyData] = useState([
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
    {
      type: "1111",
      timestamp: "11:09:05 23012025",
      description: "Bơm nước khu A hoàn thành",
    },
  ]);

  return (
    <div className="container">
      {/* Nội dung chính */}
      <div className="historyContainer">
        <table className="historyTable">
          <thead>
            <tr>
              <th>Type</th>
              <th>Timestamp</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {historyData.map((item, index) => (
              <tr key={index}>
                <td>{item.type}</td>
                <td>{item.timestamp}</td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
