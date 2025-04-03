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

import './dashboard_layout.scss';

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
      setIsLoadingNoti(true);
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
          // *** SỬA Ở ĐÂY: Thêm kiểu dữ liệu cho a và b ***
          const sortedNotifications = (listResponse.data?.notifications || []).sort(
            (a: InfoNotiType, b: InfoNotiType) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setNotifications(sortedNotifications);
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
    if (!isNotiPanelVisible) {
      setIsLoadingNoti(true);
      setFetchNotiFlag(prev => !prev);
    }
    op.current?.toggle(event);
    setIsViewingNotiDetail(false);
    setSelectedNoti(null);
  };

  const handlePanelShow = () => {
    setIsNotiPanelVisible(true);
  }

  const handlePanelHide = () => {
    setIsNotiPanelVisible(false);
    setIsViewingNotiDetail(false);
    setSelectedNoti(null);
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
      if (!text) return '';
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
            className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150 ease-in-out ${!noti.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}`}
            onClick={() => handleNotiItemClick(noti)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNotiItemClick(noti)}
            aria-label={`Thông báo: ${noti.message}`}
            title={noti.message}
          >
            <div className="flex-grow pr-2 overflow-hidden">
              <p className={`text-sm mb-0.5 ${!noti.isRead ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'} truncate`}>
                 {truncateText(noti.message, 50)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {moment(noti.createdAt).fromNow()}
              </p>
            </div>
            {!noti.isRead && (
              <div className="bg-blue-500 w-2.5 h-2.5 rounded-full flex-shrink-0 ml-auto" aria-label="Chưa đọc"></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderNotiDetail = () => {
    if (!selectedNoti) return null;

    return (
      <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <div className="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Chi tiết thông báo</h3>
          <Button
            icon="pi pi-arrow-left"
            className="p-button-sm p-button-secondary p-button-text text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={handleBackToList}
            aria-label="Quay lại danh sách"
            tooltip="Quay lại"
            tooltipOptions={{ position: 'top' }}
            autoFocus
          />
        </div>
        <p className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">{selectedNoti.message}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {moment(selectedNoti.createdAt).format('LLL')} ({moment(selectedNoti.createdAt).fromNow()})
        </p>
      </div>
    );
  };

  const handleLogout = () => {
    setIsConfirmDialogVisible(true);
    confirmDialog({
      message: 'Bạn có chắc chắn muốn đăng xuất không?',
      header: 'Xác nhận đăng xuất',
      icon: 'pi pi-exclamation-triangle text-orange-500',
      acceptClassName: 'p-button-danger',
      rejectClassName: 'p-button-text p-button-secondary',
      acceptLabel: 'Đăng xuất',
      rejectLabel: 'Hủy',
      accept: confirmLogout,
      onHide: () => setIsConfirmDialogVisible(false),
      dismissableMask: true,
    });
  };

  const confirmLogout = () => {
    localStorage.clear();
    navigate("/login");
    toast.current?.show({ severity: 'success', summary: 'Thành công', detail: 'Đã đăng xuất.', life: 3000 });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `p-2.5 rounded-lg transition-colors duration-200 ease-in-out flex justify-center items-center relative group ${
    isActive
      ? "bg-blue-100/30 text-white"
      : "text-white hover:bg-white/20 hover:text-gray-100"
    }`;

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
        className="relative h-screen w-screen bg-cover bg-center flex overflow-hidden"
        style={{ backgroundImage: "url('/src/assets/bg.jpg')" }}
      >
        <div className="flex-shrink-0 z-20">
          <div className="fixed top-0 left-0 h-full flex items-center">
             <div className="flex flex-col gap-4 bg-black/30 backdrop-blur-md p-3 rounded-r-xl shadow-lg">
                <Tooltip target=".sidebar-home-icon" content="Trang chủ" position="right" showDelay={150}/>
                <NavLink
                  to="home"
                  className={(navData) => `${navLinkClass(navData)} sidebar-home-icon`}
                  aria-label="Trang chủ"
                >
                  <FaHome size={22} />
                </NavLink>

                <Tooltip target=".sidebar-device-icon" content="Thiết bị" position="right" showDelay={150}/>
                <NavLink
                  to="device"
                   className={(navData) => `${navLinkClass(navData)} sidebar-device-icon`}
                  aria-label="Thiết bị"
                >
                  <FaShower size={22} />
                </NavLink>

                <Tooltip target=".sidebar-users-icon" content="Quản lý người dùng" position="right" showDelay={150}/>
                <NavLink
                  to="usermanager"
                   className={(navData) => `${navLinkClass(navData)} sidebar-users-icon`}
                  aria-label="Quản lý người dùng"
                >
                  <FaUsers size={22} />
                </NavLink>

                <Tooltip target=".sidebar-history-icon" content="Lịch sử" position="right" showDelay={150}/>
                <NavLink
                  to="history"
                   className={(navData) => `${navLinkClass(navData)} sidebar-history-icon`}
                  aria-label="Lịch sử"
                >
                  <FaHistory size={22} />
                </NavLink>

                <Tooltip target=".sidebar-settings-icon" content="Cài đặt" position="right" showDelay={150}/>
                <NavLink
                  to="setting"
                   className={(navData) => `${navLinkClass(navData)} sidebar-settings-icon`}
                  aria-label="Cài đặt"
                >
                  <FaCog size={22} />
                </NavLink>

                <div className="flex-grow"></div>

                <Tooltip target=".sidebar-logout-button" content="Đăng xuất" position="right" showDelay={150}/>
                <button
                  onClick={handleLogout}
                  className={`${navLinkClass({ isActive: false }).replace("text-white", "text-red-400").replace("hover:text-gray-100","hover:text-red-300")} sidebar-logout-button`}
                  aria-label="Đăng xuất"
                >
                  <FaSignOutAlt size={22} />
                </button>
             </div>
          </div>
        </div>

        <main className='flex-1 flex flex-col pt-16 pb-4 px-4 md:px-6 lg:px-8 overflow-y-auto z-10 ml-16'>
           <div className="fixed top-4 left-20 z-50">
            <div
              ref={bellRef}
              className="flex items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2.5 rounded-full shadow-md text-sm text-gray-800 dark:text-gray-200 cursor-pointer relative ring-1 ring-black/5"
              onClick={handleNotiBellClick}
              role="button"
              aria-label={`Thông báo ${unreadNotifications > 0 ? `(${unreadNotifications} chưa đọc)` : ''}`}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleNotiBellClick(e as any)}
              title="Mở thông báo"
            >
              <FaBell size={20} className="text-gray-600 dark:text-gray-300" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </div>
          </div>

          <div className='w-full max-w-7xl mx-auto'>
            <Outlet />
          </div>
        </main>

        <OverlayPanel
          ref={op}
          showCloseIcon={false}
          className="notification-panel shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg"
          style={{ width: '90vw', maxWidth: '380px' }}
          onShow={handlePanelShow}
          onHide={handlePanelHide}
          pt={{
            root: { className: 'mt-2 dark:bg-gray-800 bg-white' },
            content: { className: 'p-0' }
           }}
        >
          {!isViewingNotiDetail && (
            <div className="text-base font-semibold p-3 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
              Thông báo
            </div>
          )}
          {isViewingNotiDetail ? renderNotiDetail() : renderNotiList()}
        </OverlayPanel>

      </div>
    </>
  );
}