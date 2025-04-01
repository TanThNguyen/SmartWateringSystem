import { useEffect, useState } from "react";
import { logAPI } from "../../axios/log.api";
import { InfoLogType, Severity } from "../../types/log.type";
import "./log.scss";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FaChevronDown } from "react-icons/fa";

export default function HistoryPage() {
  const [username, setUsername] = useState("User");
  const [logs, setLogs] = useState<InfoLogType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [eventType, setEventType] = useState<Severity | "ALL">("ALL");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Added pagination state
  const [page, setPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const renderDropdown = (
    label: string,
    value: string,
    options: { label: string; value: string }[],
    onChange: (e: { value: string }) => void
  ) => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center justify-between px-3 h-10 border border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-100 w-80">
        <span className="truncate">
          {options.find((option) => option.value === value)?.label || label}
        </span>
        <FaChevronDown className="ml-2 text-sm" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="bg-white border border-gray-200 rounded-md shadow-lg py-2" sideOffset={5}>
          {options.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              onSelect={() => onChange({ value: option.value })}
            >
              {option.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [search, eventType, order, page, rows]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await logAPI.getAllLogs({
        search,
        eventType,
        order,
        items_per_page: rows,
        page: page,
      });
      setLogs(data.logs);
      setTotalRecords(data.total);
    } catch (error) {
      console.error("Lỗi khi lấy logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logContainer">
      <div className="filterContainer">
        <input
          type="text"
          placeholder="Tìm kiếm mô tả..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 text-lg h-10 border border-gray-300 rounded-md w-full"
        />
        {renderDropdown(
          "Tất cả",
          eventType,
          [
            { label: "Tất cả", value: "ALL" },
            { label: "Thông báo", value: Severity.INFO },
            { label: "Cảnh báo", value: Severity.WARNING },
            { label: "Lỗi", value: Severity.ERROR },
          ],
          (e) => { setEventType(e.value as Severity | "ALL"); setPage(1); }
        )}
        {renderDropdown(
          "Mới nhất",
          order,
          [
            { label: "Cũ nhất", value: "asc" },
            { label: "Mới nhất", value: "desc" },
          ],
          (e) => { setOrder(e.value as "asc" | "desc"); setPage(1); }
        )}
      </div>

      <div className="historyContainer">
        <table className="historyTable">
          <thead>
            <tr>
              <th>Loại</th>
              <th>Thời gian</th>
              <th>Mô tả</th>
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

      {/* Added Pagination */}
      <div className="pagination flex items-center justify-center mt-4 gap-4">
        <button 
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))} 
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Trước
        </button>
        <span>
          Trang {page} / {Math.ceil(totalRecords / rows) || 1}
        </span>
        <button 
          onClick={() => setPage((prev) => (prev < Math.ceil(totalRecords / rows) ? prev + 1 : prev))} 
          disabled={page >= Math.ceil(totalRecords / rows)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
