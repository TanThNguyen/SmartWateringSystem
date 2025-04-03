import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { FaHome, FaCog, FaSignOutAlt, FaUsers, FaHistory, FaShower, FaBell } from "react-icons/fa";
import { notiApi } from "../axios/notification.api";
import { InfoNotiType } from "../types/notification.type";
import moment from "moment";
import { Button } from "primereact/button";
import { OverlayPanel } from 'primereact/overlaypanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Tooltip } from 'primereact/tooltip';

export default function DashboardLayout() {
  const [username, setUsername] = useState("Người dùng");
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const toast = useRef<Toast>(null);
  const op = useRef<OverlayPanel>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const [isNotiPanelVisible, setIsNotiPanelVisible] = useState<boolean>(false);
  const [isConfirmDialogVisible, setIsConfirmDialogVisible] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<InfoNotiType[]>([]);
  const [selectedNoti, setSelectedNoti] = useState<InfoNotiType | null>(null);
  const [isViewingNotiDetail, setIsViewingNotiDetail] = useState<boolean>(false);
  const [isLoadingNoti, setIsLoadingNoti] = useState<boolean>(false);
  const [fetchNotiFlag, setFetchNotiFlag] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("name");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  useEffect(() => {
    const fetchAllNotificationData = async () => {
      try {
        const [countResponse, listResponse] = await Promise.all([
          notiApi.getUnreadCount(),
          notiApi.getAllNotifications()
        ]);

        if (countResponse?.success) {
          setUnreadNotifications(countResponse.data);
        } else {
          console.error("Không thể tải số lượng thông báo chưa đọc. Phản hồi:", countResponse);
          toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải số lượng thông báo.', life: 3000 });
        }

        if (listResponse?.success) {
          setNotifications(listResponse.data?.notifications || []);
        } else {
          console.error("Không thể tải danh sách thông báo. Phản hồi:", listResponse);
          setNotifications([]);
          toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách thông báo.', life: 3000 });
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu thông báo:", error);
        setUnreadNotifications(0);
        setNotifications([]);
        toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Đã xảy ra lỗi khi tải thông báo.', life: 3000 });
      } finally {
        setIsLoadingNoti(false);
      }
    };

    fetchAllNotificationData();
  }, [fetchNotiFlag]);

  const handleNotiBellClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsLoadingNoti(true);
    setFetchNotiFlag(!fetchNotiFlag);
    op.current?.toggle(event);
    setIsViewingNotiDetail(false);
    setSelectedNoti(null);
  };

  const handlePanelShow = () => {
    setIsNotiPanelVisible(true);
  }

  const handlePanelHide = () => {
    setIsNotiPanelVisible(false);
  }

  const handleNotiItemClick = async (noti: InfoNotiType) => {
    setSelectedNoti(noti);
    setIsViewingNotiDetail(true);
    if (!noti.isRead) {
      try {
        await notiApi.getOneNotification(noti.notificationId);
        setFetchNotiFlag(prev => !prev);
      } catch (error) {
        console.error("Không thể đánh dấu thông báo đã đọc:", error);
        toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể đánh dấu thông báo đã đọc.', life: 3000 });
      }
    }
  };

  const handleBackToList = () => {
    setIsViewingNotiDetail(false);
    setSelectedNoti(null);
  };

  const renderNotiList = () => {
    if (isLoadingNoti) {
      return <div className="flex justify-center items-center p-5 h-40"><ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="6" /></div>;
    }
    if (notifications.length === 0) {
      return <div className="p-5 text-center text-gray-500 dark:text-gray-400">Không có thông báo nào.</div>;
    }

    const truncateText = (text: string, maxLength: number) => {
      if (text.length <= maxLength) {
        return text;
      }
      return text.slice(0, maxLength) + "...";
    };


    return (
      <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
        {notifications.map((noti) => (
          <div
            key={noti.notificationId}
            className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150 ease-in-out ${!noti.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            onClick={() => handleNotiItemClick(noti)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNotiItemClick(noti)}
            aria-label={`Thông báo: ${noti.message}`}
            title={noti.message} // Add full message as browser tooltip
          >
            <div className="flex-grow pr-3 overflow-hidden"> {/* Added overflow-hidden */}
              <p className={`text-sm mb-0.5 truncate ${!noti.isRead ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                {/* Apply truncation here */}
                {truncateText(noti.message, 50)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {moment(noti.createdAt).fromNow()}
              </p>
            </div>
            {!noti.isRead && (
              <div className="bg-blue-500 w-2 h-2 rounded-full flex-shrink-0 ml-2" aria-label="Chưa đọc"></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderNotiDetail = () => {
    if (!selectedNoti) return null;

    return (
      // Change to dark background, light text
      <div className="p-4 bg-gray-800 text-gray-100">
        <div className="flex justify-between items-center mb-3 border-b border-gray-600 pb-2">
          {/* Adjust header text color */}
          <h3 className="text-base font-semibold text-gray-100">Chi tiết thông báo</h3>
          <Button
            icon="pi pi-arrow-left"
            // Adjust button for dark background
            className="p-button-sm p-button-secondary p-button-text text-gray-300 hover:bg-gray-700"
            onClick={handleBackToList}
            aria-label="Quay lại danh sách"
            autoFocus
          />
        </div>
        {/* Adjust text colors for content */}
        <p className="text-sm font-medium mb-1 text-gray-200">{selectedNoti.message}</p>
        <p className="text-xs text-gray-400 mb-4">
          {moment(selectedNoti.createdAt).format('LLL')} ({moment(selectedNoti.createdAt).fromNow()})
        </p>
      </div>
    );
  };

  const handleLogout = () => {
    setIsConfirmDialogVisible(true);
    confirmDialog({
      message: 'Bạn có chắc chắn muốn thoát không?',
      header: 'Xác nhận đăng xuất',
      icon: 'pi pi-exclamation-triangle text-orange-500',
      acceptClassName: 'p-button-danger',
      rejectClassName: 'p-button-text p-button-secondary',
      acceptLabel: 'Có, đăng xuất',
      rejectLabel: 'Hủy',
      accept: confirmLogout,
      onHide: () => setIsConfirmDialogVisible(false),
    });
  };

  const confirmLogout = () => {
    setIsConfirmDialogVisible(false);
    localStorage.clear();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `p-2 rounded transition-colors duration-200 ease-in-out flex justify-center relative sidebar-icon-container ${ // Added relative and container class
    isActive
      ? "text-blue-500"
      : "text-white hover:text-gray-300"
    }`;

  const sidebarTooltipOptions = { position: 'right', mouseTrack: true, mouseTrackTop: 15 };


  return (
    <>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      {isNotiPanelVisible && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => op.current?.hide()}
          aria-hidden="true"
        ></div>
      )}

      {isConfirmDialogVisible && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-40"
          aria-hidden="true"
        ></div>
      )}

      <div
        className="relative h-screen w-screen bg-cover bg-center flex"
        style={{ backgroundImage: "url('/src/assets/bg.jpg')" }}
      >
        <div>
          {/* Sidebar */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 flex flex-col gap-6 bg-white/20 backdrop-blur-sm p-4 rounded-r-lg z-20">
            <Tooltip target=".sidebar-home-icon" content="Trang chủ" position="right" />
            <NavLink
              to="home"
              className={({ isActive }) => `${navLinkClass({ isActive })} sidebar-home-icon`}
              aria-label="Trang chủ"
            >
              <FaHome size={24} />
            </NavLink>

            <Tooltip target=".sidebar-device-icon" content="Thiết bị" position="right" />
            <NavLink
              to="device"
              className={({ isActive }) => `${navLinkClass({ isActive })} sidebar-device-icon`}
              aria-label="Thiết bị"
            >
              <FaShower size={24} />
            </NavLink>

            <Tooltip target=".sidebar-users-icon" content="Quản lý người dùng" position="right" />
            <NavLink
              to="usermanager"
              className={({ isActive }) => `${navLinkClass({ isActive })} sidebar-users-icon`}
              aria-label="Quản lý người dùng"
            >
              <FaUsers size={24} />
            </NavLink>

            <Tooltip target=".sidebar-history-icon" content="Lịch sử" position="right" />
            <NavLink
              to="history"
              className={({ isActive }) => `${navLinkClass({ isActive })} sidebar-history-icon`}
              aria-label="Lịch sử"
            >
              <FaHistory size={24} />
            </NavLink>

            <Tooltip target=".sidebar-settings-icon" content="Cài đặt" position="right" />
            <NavLink
              to="setting"
              className={({ isActive }) => `${navLinkClass({ isActive })} sidebar-settings-icon`}
              aria-label="Cài đặt"
            >
              <FaCog size={24} />
            </NavLink>

            <Tooltip target=".sidebar-logout-button" content="Đăng xuất" position="right" />
            <button
              onClick={handleLogout}
              className="p-2 text-white hover:text-gray-300 transition-colors duration-200 ease-in-out flex justify-center sidebar-logout-button"
              aria-label="Đăng xuất"
            >
              <FaSignOutAlt size={24} />
            </button>
          </div>
          <style jsx global>{`
           /* Previous styles... */
           .notification-panel .p-overlaypanel-content {
              padding: 0 !important;
           }
           .p-overlaypanel.notification-panel {
              z-index: 45;
           }
           /* --- Tooltip Styling --- */
           .p-tooltip {
                z-index: 100 !important; /* Ensure tooltip is on top */
           }
           /* Target the text element within the tooltip */
           .p-tooltip .p-tooltip-text {
              /* background-color: rgba(0, 0, 0, 0.85) !important; --- Removed this line --- */
              color: white !important; /* White text color */
              font-weight: 600 !important; /* Bolder font weight (600 is semibold) */
           }
           /* Optional: Style the arrow if needed - ensure arrow color matches the *actual* background */
           /* .p-tooltip .p-tooltip-arrow { */
               /* You might need to adjust this based on the default background */
               /* border-right-color: black !important;  <-- Example if default is black */
           /* } */

           /* Confirm Dialog Styles... */
           .p-confirm-dialog {
              max-width: 500px !important;
              width: 90vw !important;
              z-index: 50 !important;
              border-radius: 0.75rem !important;
              box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
           }
           /* ... other confirm dialog styles */
           .p-confirm-dialog .p-dialog-footer {
              /* ... */
              display: flex !important;
              justify-content: space-between !important;
           }
           /* ... other confirm dialog styles */
        `}</style>
        </div>

        <main className='flex-1 flex items-center justify-center p-4 overflow-y-auto z-10'>
          <div className="absolute top-4 left-4 z-50">
            <div
              ref={bellRef}
              className="flex items-center bg-white/90 backdrop-blur-sm p-3 rounded-md shadow-md text-sm text-gray-800 cursor-pointer relative"
              onClick={handleNotiBellClick}
              role="button"
              aria-label={`Thông báo ${unreadNotifications > 0 ? `(${unreadNotifications} chưa đọc)` : ''}`}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleNotiBellClick(e as any)}
            >
              <FaBell size={24} className="text-gray-700" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center pointer-events-none">
                  {unreadNotifications}
                </span>
              )}
            </div>
          </div>

          <div className='w-full max-w-7xl mt-16 lg:mt-4'>
            <Outlet />
          </div>
        </main>

        <OverlayPanel
          ref={op}
          showCloseIcon={false}
          // Apply dark mode classes conditionally or globally if desired
          className="notification-panel bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg"
          style={{ width: '90vw', maxWidth: '400px' }}
          onShow={handlePanelShow}
          onHide={handlePanelHide}
          pt={{ root: { className: 'mt-2' } }}
        >
          {/* Header adapts to dark/light */}
          {!isViewingNotiDetail && (
            <div className="text-base font-semibold p-3 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
              Thông báo
            </div>
          )}
          {isViewingNotiDetail ? renderNotiDetail() : renderNotiList()}
        </OverlayPanel>

        <style jsx global>{`
           .notification-panel .p-overlaypanel-content {
              padding: 0 !important;
           }
           .p-overlaypanel.notification-panel {
              z-index: 45;
           }
           .p-tooltip {
                z-index: 100 !important; /* Ensure tooltip is on top */
           }
           .p-confirm-dialog {
              max-width: 500px !important;
              width: 90vw !important;
              z-index: 50 !important;
              border-radius: 0.75rem !important;
              box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
           }
           .p-confirm-dialog .p-dialog-header {
             background-color: #f8f9fa;
             color: #495057;
             border-top-left-radius: 0.75rem !important;
             border-top-right-radius: 0.75rem !important;
             padding: 1rem 1.5rem !important;
           }
           .p-confirm-dialog .p-dialog-content {
              padding: 1.5rem !important;
              background-color: #ffffff;
              color: #495057;
              display: flex;
              align-items: center;
           }
           .p-confirm-dialog .p-dialog-footer {
              background-color: #f8f9fa;
              border-bottom-left-radius: 0.75rem !important;
              border-bottom-right-radius: 0.75rem !important;
              padding: 1rem 1.5rem !important;
              display: flex !important;
              justify-content: space-between !important;
           }
           .p-confirm-dialog .p-confirm-dialog-icon {
              font-size: 1.75rem !important;
              margin-right: 1rem !important;
              flex-shrink: 0;
           }
            .p-confirm-dialog .p-confirm-dialog-message {
                line-height: 1.6;
            }

           .p-dialog-mask.p-component-overlay {
              z-index: 40;
           }
           .p-dialog-mask.p-component-overlay-enter {
              z-index: 40;
           }
        `}</style>

      </div>
    </>
  );
}