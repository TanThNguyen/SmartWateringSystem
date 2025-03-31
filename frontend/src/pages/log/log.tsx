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
  }, [search, eventType, order]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await logAPI.getAllLogs({
        search,
        eventType,
        order,
        items_per_page: 1000,
        page: 1,
      });
      setLogs(data.logs);
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
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 text-lg h-10 border border-gray-300 rounded-md w-full"
        />
        {/* <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as Severity | "ALL")}
          className="h-10 border border-gray-300 rounded-md px-2 w-80"
        >
          <option value="ALL">Tất cả</option>
          <option value={Severity.INFO}>Thông báo</option>
          <option value={Severity.WARNING}>Cảnh báo</option>
          <option value={Severity.ERROR}>Lỗi</option>
        </select>
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
          className="h-10 border border-gray-300 rounded-md px-2 w-80"
        >
          <option value="asc">Cũ nhất</option>
          <option value="desc">Mới nhất</option>
        </select> */}
        {renderDropdown(
          "Tất cả",
          eventType,
          [
            { label: "Tất cả", value: "ALL" },
            { label: "Thông báo", value: Severity.INFO },
            { label: "Cảnh báo", value: Severity.WARNING },
            { label: "Lỗi", value: Severity.ERROR },
          ],
          (e) => setEventType(e.value as Severity | "ALL")
        )}
        {renderDropdown(
          "Mới nhất",
          order,
          [
            { label: "Cũ nhất", value: "asc" },
            { label: "Mới nhất", value: "desc" },
          ],
          (e) => setOrder(e.value as "asc" | "desc")
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
    </div>
  );
}
