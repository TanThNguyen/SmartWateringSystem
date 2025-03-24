import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import { logAPI } from "../../axios/log.api";
import { InfoLogType, Severity } from "../../types/log.type";
import "./log.scss";

export default function HistoryPage() {
  const [username, setUsername] = useState("User");
  const [logs, setLogs] = useState<InfoLogType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [eventType, setEventType] = useState<Severity | "ALL">("ALL");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  // const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, search, eventType, order]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await logAPI.getAllLogs({
        page: currentPage,
        items_per_page: 10,
        search,
        eventType,
        order,
      });
      console.log(data);
      setLogs(data.logs);
      setTotalPages(data.lastPage);
    } catch (error) {
      console.error("Lỗi khi lấy logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="mainContent">
        <div className="topBar">
          <div className="logoCircle">1</div>
          <div className="titleAndTime">
            <div className="welcomeText">Welcome Farm, {username}!</div>
            <div className="dateTime">
              <div>{new Date().toLocaleTimeString()}</div>
              <div>{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="filterBar">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={eventType} onChange={(e) => setEventType(e.target.value as Severity | "ALL")}>  
            <option value="ALL">Tất cả</option>
            <option value={Severity.INFO}>INFO</option>
            <option value={Severity.WARNING}>WARNING</option>
            <option value={Severity.ERROR}>ERROR</option>
          </select>
          <select value={order} onChange={(e) => setOrder(e.target.value as "asc" | "desc")}>  
            <option value="asc">Cũ nhất</option>
            <option value="desc">Mới nhất</option>
          </select>
        </div>

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
              {loading ? (
                <tr><td colSpan={3} style={{ textAlign: "center" }}>Đang tải dữ liệu...</td></tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.logId}>
                    <td>{log.eventType}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.description}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} style={{ textAlign: "center" }}>Không có dữ liệu.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>Trước</button>
          <span>Trang {currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)}>Sau</button>
        </div>
      </div>
    </div>
  );
}
