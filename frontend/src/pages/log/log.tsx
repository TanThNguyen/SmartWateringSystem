import { useEffect, useState, useCallback, useMemo } from "react";
import { logAPI } from "../../axios/log.api";
import { InfoLogType, Severity } from "../../types/log.type";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FaChevronDown } from "react-icons/fa";

import "./log.scss";

export default function HistoryPage() {
  const [logs, setLogs] = useState<InfoLogType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [eventType, setEventType] = useState<Severity | "ALL">("ALL");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  
  const [page, setPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(15); 
  const [totalRecords, setTotalRecords] = useState<number>(0);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await logAPI.getAllLogs({
                search: search.trim() || undefined,
                eventType: eventType === "ALL" ? undefined : eventType,
                order,
                items_per_page: itemsPerPage,
                page: page,
            });
            setLogs(data.logs || []);
            setTotalRecords(data.total || 0);

            
             const maxPage = Math.ceil((data.total || 0) / itemsPerPage) || 1;
             if (page > maxPage) {
                 setPage(maxPage);
             } else if (page < 1 && data.total > 0) {
                 setPage(1);
             }

        } catch (error) {
            console.error("Lỗi khi lấy logs:", error);
            setLogs([]);
            setTotalRecords(0);
            
        } finally {
            setLoading(false);
        }
    }, [search, eventType, order, page, itemsPerPage]);


    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]); 


  const handlePageChange = (newPage: number) => {
        const maxPage = Math.ceil(totalRecords / itemsPerPage) || 1;
        if (newPage >= 1 && newPage <= maxPage) {
            setPage(newPage);
        }
   };

  const renderDropdown = (
    label: string,
    value: string,
    options: { label: string; value: string }[],
    onChange: (value: string) => void,
    dropdownWidthClass = "w-200" 
  ) => (
    <div className={`filterDropdownWrapper ${dropdownWidthClass}`}>
        <DropdownMenu.Root>
            <DropdownMenu.Trigger className="filterDropdownTrigger">
                <span title={options.find(opt => opt.value === value)?.label || label}>
                    {options.find(opt => opt.value === value)?.label || label}
                </span>
                <FaChevronDown className="filterDropdownChevron" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content className="filterDropdownContent" sideOffset={5} align="start">
                    {options.map((option) => (
                        <DropdownMenu.Item
                            key={option.value}
                            className="filterDropdownItem"
                            onSelect={() => onChange(option.value)}
                        >
                            {option.label}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    </div>
  );

   
    const eventTypeOptions = useMemo(() => [
        { label: "Tất cả loại", value: "ALL" },
        { label: "Thông báo", value: Severity.INFO },
        { label: "Cảnh báo", value: Severity.WARNING },
        { label: "Lỗi", value: Severity.ERROR },
    ], []);

    const orderOptions = useMemo(() => [
        { label: "Mới nhất", value: "desc" },
        { label: "Cũ nhất", value: "asc" },
    ], []);


  return (
    <div className="logContainer">
      <div className="filterContainer">
        <input
          type="text"
          placeholder="Tìm kiếm mô tả..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="searchInput"
        />
        {renderDropdown(
          "Loại sự kiện",
          eventType,
          eventTypeOptions,
          (value) => { setEventType(value as Severity | "ALL"); setPage(1); }
        )}
        {renderDropdown(
          "Sắp xếp",
          order,
          orderOptions,
          (value) => { setOrder(value as "asc" | "desc"); setPage(1); },
          "w-150" 
        )}
      </div>

      <div className="historyContainer">
          <div className="tableWrapper">
            <table className="historyTable">
            <thead>
                <tr>
                <th style={{ width: '15%' }}>Loại</th>
                <th style={{ width: '25%' }}>Thời gian</th>
                <th style={{ width: '60%' }}>Mô tả</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                <tr><td colSpan={3} className="noResults">Đang tải dữ liệu...</td></tr>
                ) : logs.length > 0 ? (
                logs.map((log) => (
                    <tr key={log.logId}>
                     <td>
                        <span className={`logSeverityBadge ${log.eventType}`}>
                            {log.eventType}
                        </span>
                     </td>
                    <td>{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                    <td>{log.description}</td>
                    </tr>
                ))
                ) : (
                <tr><td colSpan={3} className="noResults">Không có dữ liệu log.</td></tr>
                )}
            </tbody>
            </table>
          </div>
      </div>

      {/* Pagination */}
      {!loading && totalRecords > itemsPerPage && (
            <div className="paginationContainer">
                <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="paginationButton"
                >
                    Trước
                </button>
                <span className="paginationInfo">
                    Trang {page} / {Math.ceil(totalRecords / itemsPerPage)} 
                    {/* (Tổng: {totalRecords}) */}
                </span>
                <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.ceil(totalRecords / itemsPerPage)}
                    className="paginationButton"
                >
                    Sau
                </button>
            </div>
      )}
    </div>
  );
}