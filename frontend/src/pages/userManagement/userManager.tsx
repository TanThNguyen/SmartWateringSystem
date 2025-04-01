import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PopupModal from "../../layout/popupmodal";
import { CreateUserType, InfoUsersType, UpdateUserType, UsersRequestType } from "../../types/user.type";
import { userApi } from "../../axios/user.api";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FaChevronDown } from "react-icons/fa"; 

import { GetLocationsRequestType } from "../../types/location.type";
import { locationApi } from "../../axios/location.api";
import "./user.scss"

export default function UserManagementPage() {

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<InfoUsersType[]>([]);

  const [searchText, setSearchText] = useState("");
  const [permissionFilter, setPermissionFilter] = useState("ALL");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [locationIdFilter, setLocationIdFilter] = useState("ALL");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserType>({
    name: "",
    email: "",
    locationId: "",
    phone: "",
    password: "",
    role: "GARDENER",
  });

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updatedUser, setUpdatedUser] = useState<UpdateUserType | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [locations, setLocations] = useState<any[]>([]);

  // New pagination states
  const [first, setFirst] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  useEffect(() => {
    fetchLocations();
    fetchUsers();
  }, [order, permissionFilter, locationIdFilter, searchText, first, rows]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAddForm) setShowAddForm(false);
        if (showUpdateForm) setShowUpdateForm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddForm, showUpdateForm]);

  const fetchUsers = async () => {
    setLoading(true);
    const request: UsersRequestType = {
      page: Math.ceil(first / rows) + 1,
      items_per_page: rows,
      search: searchText.trim(),
      role: permissionFilter,
      order,
    };
    if (locationIdFilter !== "ALL") {
      request.locationId = locationIdFilter;
    }
    try {
      const response = await userApi.getAllUsers(request);
      setUsers(response.users);
      setTotalRecords(response.total);
      setFirst((response.currentPage - 1) * rows);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    const request: GetLocationsRequestType = {
      search: '',
      order: '',
    }
    try {
      const response = await locationApi.getAllLocations(request);
      setLocations(response.locations);
      console.log(response);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách vị trí");
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const renderDropdown = (
    label: string,
    value: any,
    options: { label: string; value: any }[],
    onChange: (e: any) => void
  ) => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center justify-between px-3 h-10 border border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-100 w-80">
        <span className="truncate">{options.find((option) => option.value === value)?.label || label}</span>
        <FaChevronDown className="ml-2 text-sm" />
      </DropdownMenu.Trigger>
  
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-white border border-gray-200 rounded-md shadow-lg py-2"
          sideOffset={5}
        >
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
  

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async () => {

    try {
      await userApi.createUser(newUser);
      fetchUsers();
      setShowAddForm(false);
      setNewUser({ name: "", email: "", locationId: "KV1", phone: "", password: "", role: "GARDENER" });
      toast.success("Người dùng mới đã được tạo thành công!");
    } catch (error) {
      toast.error("Lỗi khi tạo người dùng");
    }
  };


  ////////////////////////////////
  //Delete
  const handleDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    try {
      await userApi.deleteUsers(selectedUsers);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error("Lỗi khi xóa người dùng:", error);
    }
  };


  // UPDATE USER

  const handleUpdateUser = async (updatedUser: UpdateUserType) => {
    try {
      const updatedUserWithLocationId = {
        ...updatedUser,
        locationId: updatedUser.locationId, 
      };

      await userApi.updateUser(updatedUserWithLocationId);
      fetchUsers();
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error);
    }
  };



  const handleOpenUpdateForm = (user: UpdateUserType) => {
    setUpdatedUser(user);
    setShowUpdateForm(true);
  };


  const handleSubmit = () => {
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
    if (!updatedUser) return;
    setUpdatedUser({ ...updatedUser, [e.target.name]: e.target.value });
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };
  ////////////////////////////////
  // if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <div className="filterContainer flex items-center gap-4">
        <input
          type="text"
          placeholder="Tìm kiếm người dùng..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="px-4 text-lg h-10 border border-gray-300 rounded-md"
        />
   
        {renderDropdown(
          "Vai trò",
          permissionFilter,
          [
            { label: "Công việc", value: "ALL" },
            { label: "Quản trị viên", value: "ADMIN" },
            { label: "Làm vườn", value: "GARDENER" },
            { label: "Không hoạt động", value: "INACTIVE" },
          ],
          (e) => setPermissionFilter(e.value)
        )}

        
        {renderDropdown(
          "Sắp xếp",
          order,
          [
            { label: "Mới nhất", value: "desc" },
            { label: "Lâu nhất", value: "asc" },
          ],
          (e) => setOrder(e.value)
        )} 

        {renderDropdown(
          "Khu vực",
          locationIdFilter,
          [
            { label: "Khu vực", value: "ALL" }, 
            { label: "Khu vực 1", value: "KV1" },
            { label: "Khu vực 2", value: "KV2" },         
          ],
          (e) => setLocationIdFilter(e.value),
        )}

        
        <button onClick={() => setShowAddForm(true)}
          className="bg-orange-600 text-white px-4 h-10 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
        >
          Thêm
        </button>
        <button onClick={handleDeleteUsers} disabled={selectedUsers.length === 0}
          className="bg-orange-600 text-white px-4 h-10 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
        >Xóa</button>
      </div>

      <div className="tableContainer" >
        <table className="userTable">
          <thead>
            <tr>
              <th>  </th>
              <th>Tên</th>
              <th>Email</th>
              <th>Địa điểm</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={index} onClick={() => {
                    const upuser: UpdateUserType = {
                      userId: user.userId,
                      name: user.name,
                      email: user.email,
                      locationId: user.locationId || (locations.find(l => l.name === user.locationName)?.locationId || ""),
                      phone: user.phone,
                      role: user.role,
                      password: "password123",
                    };
                    handleOpenUpdateForm(upuser);
                }}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.userId)}
                      onChange={() => toggleSelectUser(user.userId)}
                      className="w-5 h-5"
                    />
                  </td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.locationName}</td>
                  <td>{user.phone}</td>
                  <td>
                    <span className={`permissionBadge ${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="noResults">
                  Không tìm được người dùng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination flex items-center justify-center mt-4 gap-4">
        <button 
          onClick={() => setFirst(prev => Math.max(prev - rows, 0))}
          disabled={first === 0}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Trước
        </button>
        <span>
          Trang {Math.ceil(first / rows) + 1} / {Math.ceil(totalRecords / rows)}
        </span>
        <button 
          onClick={() => setFirst(prev => (prev + rows < totalRecords ? prev + rows : prev))}
          disabled={first + rows >= totalRecords}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Sau
        </button>
      </div>

      {showAddForm && (
        <div 
          className="modalOverlay" 
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }}
        >
          <PopupModal title="Add New User" onClose={() => setShowAddForm(false)}>
            <input
              type="text"
              name="name"
              value={newUser.name}
              onChange={handleNewUserChange}
              placeholder="Name"
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
            >
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

            <div className="modalActions">
              <button onClick={handleCreateUser} className="bg-green-500 text-white px-4 py-2 rounded">
                Tạo
              </button>
              <button onClick={() => setShowAddForm(false)} className="bg-red-500 text-white px-4 py-2 rounded">
                Hủy
              </button>
            </div>
          </PopupModal>
        </div>
      )}

      {showUpdateForm && updatedUser && (
        <div 
          className="modalOverlay" 
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpdateForm(false); }}
        >
          <PopupModal
            title="Cập nhật người dùng"
            onClose={() => setShowUpdateForm(false)}
          >
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
            <div className="flex justify-between mt-4">
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Cập nhật
              </button>
              <button
                onClick={() => setShowUpdateForm(false)}
                className="px-4 py-2 bg-gray-300 rounded"
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
