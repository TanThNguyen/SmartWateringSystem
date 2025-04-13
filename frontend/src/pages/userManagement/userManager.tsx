import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PopupModal from "../../layout/popupmodal"; // Giữ nguyên import và cách dùng
import { CreateUserType, InfoUsersType, UpdateUserType, UsersRequestType } from "../../types/user.type";
import { userApi } from "../../axios/user.api";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FaChevronDown } from "react-icons/fa";

import { GetLocationsRequestType } from "../../types/location.type";
import { locationApi } from "../../axios/location.api";

// Import SCSS file
import "./user.scss"; // Đường dẫn đến file SCSS

export default function UserManagementPage() {

  // --- GIỮ NGUYÊN TOÀN BỘ LOGIC STATE ---
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<InfoUsersType[]>([]);
  const [searchText, setSearchText] = useState("");
  const [permissionFilter, setPermissionFilter] = useState("ALL");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [locationIdFilter, setLocationIdFilter] = useState("ALL"); // Giữ nguyên giá trị này
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserType>({
    name: "",
    email: "",
    locationId: "ALL", // Giữ nguyên giá trị khởi tạo ban đầu
    phone: "",
    password: "",
    role: "GARDENER",
  });
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updatedUser, setUpdatedUser] = useState<UpdateUserType | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [first, setFirst] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // --- GIỮ NGUYÊN TOÀN BỘ LOGIC USEEFFECT ---
  useEffect(() => {
    fetchLocations();
    fetchUsers(); // Giữ nguyên thứ tự gọi hàm
  }, [order, permissionFilter, locationIdFilter, searchText, first, rows]); // Giữ nguyên dependencies

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAddForm) setShowAddForm(false);
        if (showUpdateForm) setShowUpdateForm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddForm, showUpdateForm]); // Giữ nguyên dependencies

  // --- GIỮ NGUYÊN TOÀN BỘ LOGIC HÀM ---
  const fetchUsers = async () => {
    setLoading(true);
    // Giữ nguyên cách tạo request object
    const request: UsersRequestType = {
      page: Math.ceil(first / rows) + 1,
      items_per_page: rows,
      search: searchText.trim(),
      role: permissionFilter, // Giữ nguyên giá trị state
      order,
      // Giữ nguyên cách xử lý locationIdFilter
      locationId: (locations.find(l => l.name === locationIdFilter)?.locationId || "ALL"),
    };

    console.log(request); // Giữ nguyên console.log
    try {
      const response = await userApi.getAllUsers(request);
      setUsers(response.users);
      setTotalRecords(response.total);
      setFirst((response.currentPage - 1) * rows); // Giữ nguyên logic cập nhật first
    } catch (error) {
      toast.error("Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    // Giữ nguyên cách tạo request
    const request: GetLocationsRequestType = {
      search: '',
      order: '',
    }
    try {
      const response = await locationApi.getAllLocations(request);
      setLocations(response.locations);
      console.log(response); // Giữ nguyên console.log
    } catch (error) {
      toast.error("Lỗi khi tải danh sách vị trí");
    }
  };

  const handleSearch = () => {
    // Không thay đổi gì ở đây
    fetchUsers();
  };

  // Giữ nguyên hàm renderDropdown, chỉ thay đổi className bên trong JSX trả về
  const renderDropdown = (
    label: string,
    value: any,
    options: { label: string; value: any }[],
    onChange: (e: any) => void // Giữ nguyên signature
  ) => (
    // Chỉ thêm wrapper và thay className
    <div className="filterDropdownWrapper">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="filterDropdownTrigger">
          {/* Giữ nguyên logic hiển thị label cũ */}
          <span className="truncate">{options.find((option) => option.value === value)?.label || label}</span>
          <FaChevronDown className="filterDropdownChevron" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="filterDropdownContent" // Chỉ thay className
            sideOffset={5}
          >
            {options.map((option) => (
              <DropdownMenu.Item
                key={option.value}
                className="filterDropdownItem" // Chỉ thay className
                // Giữ nguyên logic onSelect
                onSelect={() => onChange({ value: option.value })}
              >
                {option.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );


  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Không thay đổi gì ở đây
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async () => {
    // Không thay đổi gì ở đây
    try {
      console.log(newUser)
      await userApi.createUser(newUser);
      fetchUsers();
      setShowAddForm(false);
      // Giữ nguyên logic reset state
      setNewUser({ name: "", email: "", locationId: "KV1", phone: "", password: "", role: "GARDENER" });
      toast.success("Người dùng mới đã được tạo thành công!");
    } catch (error) {
      toast.error("Lỗi khi tạo người dùng");
    }
  };

  const handleDeleteUsers = async () => {
    // Không thay đổi gì ở đây
    if (selectedUsers.length === 0) return;
    try {
      await userApi.deleteUsers(selectedUsers);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error("Lỗi khi xóa người dùng:", error); // Giữ nguyên console.error
    }
  };

  const handleUpdateUser = async (updatedUser: UpdateUserType) => {
    // Không thay đổi gì ở đây
    try {
      const updatedUserWithLocationId = {
        ...updatedUser,
        locationId: updatedUser.locationId,
      };
      await userApi.updateUser(updatedUserWithLocationId);
      fetchUsers();
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error); // Giữ nguyên console.error
    }
  };

  const handleOpenUpdateForm = (user: UpdateUserType) => {
    // Không thay đổi gì ở đây
    setUpdatedUser(user);
    setShowUpdateForm(true);
  };

  const handleSubmit = () => {
    // Không thay đổi gì ở đây
    if (updatedUser) {
      const updatedUserWithLocationId = {
        ...updatedUser,
        locationId: updatedUser.locationId,
      };
      handleUpdateUser(updatedUserWithLocationId);
      setShowUpdateForm(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Không thay đổi gì ở đây
    if (!updatedUser) return;
    setUpdatedUser({ ...updatedUser, [e.target.name]: e.target.value });
  };

  const toggleSelectUser = (userId: string) => {
    // Không thay đổi gì ở đây
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Giữ nguyên return loading nếu có
  // if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    // Thay className của thẻ div ngoài cùng
    <div className="container">
      {/* Thay className của div filter và bỏ các class Tailwind */}
      <div className="filterContainer">
        <input
          type="text"
          placeholder="Tìm kiếm người dùng..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          // Chỉ thay className
          className="searchInput"
        />

        {/* Giữ nguyên cách gọi renderDropdown */}
        {renderDropdown(
          "Vai trò",
          permissionFilter,
          [
            { label: "Công việc", value: "ALL" },
            { label: "Quản trị viên", value: "ADMIN" },
            { label: "Làm vườn", value: "GARDENER" },
            { label: "Không hoạt động", value: "INACTIVE" },
          ],
          (e) => setPermissionFilter(e.value) // Giữ nguyên callback
        )}


        {renderDropdown(
          "Sắp xếp",
          order,
          [
            { label: "Mới nhất", value: "desc" },
            { label: "Lâu nhất", value: "asc" },
          ],
          (e) => setOrder(e.value) // Giữ nguyên callback
        )}

        {renderDropdown(
          "Khu vực",
          locationIdFilter, // Giữ nguyên value là state locationIdFilter (string "kv1", "kv2", "ALL")
          [
            { label: "Khu vực", value: "ALL" },
            { label: "Khu vực 1", value: "kv1" }, // Giữ nguyên các option này
            { label: "Khu vực 2", value: "kv2" },
          ],
          (e) => setLocationIdFilter(e.value), // Giữ nguyên callback
        )}


        {/* Chỉ thay className của button */}
        {/* <button onClick={() => setShowAddForm(true)}
          className="actionButton"
        >
          Thêm Mới

        <button onClick={handleDeleteUsers} disabled={selectedUsers.length === 0}
          className="actionButton" // SCSS sẽ tự xử lý :disabled
        >Xóa</button> */}

        <button
          onClick={() => setShowAddForm(true)}
          className="button addButton"
        >
          Thêm Mới
        </button>
        <button
          onClick={handleDeleteUsers}
          disabled={selectedUsers.length === 0 || loading}
          className="button deleteButton"
        >
          Xóa ({selectedUsers.length})
        </button>
      </div>

      {/* Chỉ thay className của div table container */}
      <div className="tableContainer">
        {/* Thêm wrapper div này để SCSS xử lý scroll nếu cần */}
        <div className="tableWrapper">
          {/* Chỉ thay className của table */}
          <table className="userTable">
            <thead>
              <tr>
                {/* Thêm className nếu SCSS có định nghĩa riêng cho ô checkbox header */}
                <th className="checkboxCell"></th>
                <th>Tên</th>
                <th>Email</th>
                <th>Địa điểm</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {/* Giữ nguyên logic render */}
              {users.length > 0 ? (
                users.map((user, index) => ( // Giữ nguyên key={index} nếu bạn dùng nó
                  <tr key={index} onClick={() => {
                    // Giữ nguyên logic tạo upuser và gọi hàm
                    const upuser: UpdateUserType = {
                      userId: user.userId,
                      name: user.name,
                      email: user.email,
                      locationId: user.locationId,
                      phone: user.phone,
                      role: user.role,
                      password: "password123", // Giữ nguyên password mặc định này
                    };
                    handleOpenUpdateForm(upuser);
                  }}>
                    {/* Thêm className và giữ nguyên logicstopPropagation */}
                    <td className="checkboxCell" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.userId)}
                        onChange={() => toggleSelectUser(user.userId)}
                        // Chỉ thay className
                        className="checkboxInput"
                      />
                    </td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    {/* Giữ nguyên logic tìm tên location */}
                    <td>{(locations.find(l => l.locationId === user.locationId)?.name || "")}</td>
                    <td>{user.phone}</td>
                    <td>
                      {/* Giữ nguyên logic tạo className động */}
                      <span className={`permissionBadge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  {/* Chỉ thay className */}
                  <td colSpan={7} className="noResults">
                    Không tìm được người dùng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div> {/* Kết thúc tableWrapper */}
      </div>

      {/* Chỉ thay className của div pagination và bỏ các class Tailwind */}
      <div className="paginationContainer">
        <button
          onClick={() => setFirst(prev => Math.max(prev - rows, 0))}
          disabled={first === 0}
          // Chỉ thay className
          className="paginationButton"
        >
          Trước
        </button>
        {/* Chỉ thay className */}
        <span className="paginationInfo">
          Trang {Math.ceil(first / rows) + 1} / {Math.ceil(totalRecords / rows)}
        </span>
        <button
          onClick={() => setFirst(prev => (prev + rows < totalRecords ? prev + rows : prev))}
          disabled={first + rows >= totalRecords}
          // Chỉ thay className
          className="paginationButton"
        >
          Sau
        </button>
      </div>

      {/* --- MODAL THÊM --- */}
      {showAddForm && (
        // Chỉ thay className overlay
        <div
          className="modalOverlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }}
        >
          {/* Giữ nguyên component PopupModal và props */}
          <PopupModal title="Thêm người dùng mới" onClose={() => setShowAddForm(false)}>
            {/* Thêm wrapper content nếu cần cho SCSS */}
            <div className="modalContent">
              {/* Giữ nguyên các input và select, không thêm label nếu không có */}
              <input
                type="text"
                name="name"
                value={newUser.name}
                onChange={handleNewUserChange}
                placeholder="Name"
              // Không thêm className cho input trừ khi SCSS có định nghĩa riêng
              />
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                placeholder="Email"
              />
              <select
                name="locationId"
                value={newUser.locationId}
                onChange={handleNewUserChange}
              // Không thêm className cho select trừ khi SCSS có định nghĩa riêng
              >
                {/* Giữ nguyên logic render option */}
                <option value="" disabled hidden>
                  Chọn khu vực
                </option>
                {locations.map((location) => (
                  <option key={location.locationId} value={location.locationId}>
                    {location.name}
                  </option>
                ))}
              </select>


              <input
                type="text"
                name="phone"
                value={newUser.phone}
                onChange={handleNewUserChange}
                placeholder="Phone"
              />
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleNewUserChange}
                placeholder="Password"
              />
              <select
                name="role"
                value={newUser.role}
                onChange={handleNewUserChange}
              >
                <option value="GARDENER">Gardener</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Chỉ thay className của div actions và các button bên trong */}
            <div className="modalActions">
              {/* Áp dụng className modalButton và lớp bổ trợ */}
              <button onClick={handleCreateUser} className="modalButton success">
                Tạo mới
              </button>
              <button onClick={() => setShowAddForm(false)} className="modalButton secondary">
                Hủy
              </button>
            </div>
          </PopupModal>
        </div>
      )}

      {/* --- MODAL CẬP NHẬT --- */}
      {showUpdateForm && updatedUser && (
        // Chỉ thay className overlay
        <div
          className="modalOverlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpdateForm(false); }}
        >
          {/* Giữ nguyên component PopupModal và props */}
          <PopupModal
            title="Cập nhật người dùng"
            onClose={() => setShowUpdateForm(false)}
          >
            {/* Thêm wrapper content nếu cần cho SCSS */}
            <div className="modalContent">
              {/* Giữ nguyên cấu trúc label và input */}
              <label>
                Tên:
                <input
                  type="text"
                  name="name"
                  value={updatedUser.name}
                  onChange={handleChange}
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={updatedUser.email}
                  onChange={handleChange}
                />
              </label>
              <label> {/* Thêm label cho location nếu cần */}
                Khu vực:
                <select
                  name="locationId"
                  value={updatedUser.locationId}
                  onChange={handleChange}
                >
                  <option value="" disabled hidden>Chọn khu vực</option>
                  {locations.map((location) => (
                    <option key={location.locationId} value={location.locationId}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Số điện thoại:
                <input
                  type="text"
                  name="phone"
                  value={updatedUser.phone}
                  onChange={handleChange}
                />
              </label>
              <label>
                Mật khẩu (đã tự động reset thành mặc định):
                <input
                  type="password"
                  name="password"
                  value={updatedUser.password}
                  onChange={handleChange}
                // Không thay đổi placeholder nếu đã có
                />
              </label>
              <label>
                Vai trò:
                <select name="role" value={updatedUser.role} onChange={handleChange}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="GARDENER">GARDENER</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
            </div>
            {/* Chỉ thay className của div actions và các button bên trong, bỏ class Tailwind */}
            <div className="modalActions">
              <button
                onClick={handleSubmit} // Giữ nguyên onClick={handleSubmit}
                // Áp dụng className modalButton và lớp bổ trợ
                className="modalButton primary"
              >
                Cập nhật
              </button>
              <button
                onClick={() => setShowUpdateForm(false)}
                // Áp dụng className modalButton và lớp bổ trợ
                className="modalButton secondary"
              >
                Hủy
              </button>
            </div>
          </PopupModal>
        </div>
      )}
    </div>
  );
}