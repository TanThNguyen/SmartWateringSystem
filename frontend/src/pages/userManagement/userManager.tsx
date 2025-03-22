import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PopupModal from "../../layout/popupmodal";
import { CreateUserType, InfoUsersType, UpdateUserType, UsersRequestType } from "../../types/user.type";
import { userApi } from "../../axios/user.api";
import { Paginator } from "primereact/paginator";
import { Dropdown } from "primereact/dropdown";
import { GetLocationsRequestType } from "../../types/location.type";
import { locationApi } from "../../axios/location.api";
import "./user.scss"

export default function UserManagementPage() {

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<InfoUsersType[]>([]);

  const [username, setUsername] = useState("User");
  const [first, setFirst] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const [searchText, setSearchText] = useState("");
  const [permissionFilter, setPermissionFilter] = useState("ALL");
  const [order, setOrder] = useState<"asc" | "desc">("desc");


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

  useEffect(() => {
    // const storedUser = localStorage.getItem("username");
    // if (storedUser) setUsername(storedUser);
    fetchLocations();
    fetchUsers();
  }, [first, rows, order]);

  const fetchUsers = async () => {
    setLoading(true);
    const request: UsersRequestType = {
      page: Math.ceil(first / rows) + 1,
      items_per_page: rows,
      search: searchText.trim(),
      role: permissionFilter,
      order,
    };
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
    setFirst(0);
    fetchUsers();
  };

  const renderDropdown = (
    label: string,
    value: any,
    options: { label: string; value: any }[],
    onChange: (e: any) => void
  ) => (
    <Dropdown

      value={value}
      options={options}
      onChange={onChange}
      placeholder={label}
      className='selectInput'
      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
    />
  );

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  // const handlePreCreateUser = async () => {
  //   fetchLocations();
  // };

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
  // UPDATE USER
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

  const handleUpdateUsertest = async (userId: string) => {
    const updatedUser: UpdateUserType = {
      userId: userId,
      name: "Tên cập nhật",
      email: `newuser${Date.now()}@example.com`,
      locationId: "Địa chỉ cập nhật",
      phone: "0987654321",
      password: "newpassword123",
      role: "ADMIN",
    };
    try {
      await userApi.updateUser(updatedUser);
      fetchUsers();
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error);
    }
  };


  const handleUpdateUser = async (updatedUser: UpdateUserType) => {
    try {
      // Cập nhật locationId thay vì locationName
      const updatedUserWithLocationId = {
        ...updatedUser,
        locationId: updatedUser.locationId, // Chắc chắn rằng locationId được truyền vào
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
      // Gửi locationId thay vì locationName
      const updatedUserWithLocationId = {
        ...updatedUser,
        locationId: updatedUser.locationId, // Đây là locationId bạn cần gửi khi cập nhật
      };
      handleUpdateUser(updatedUserWithLocationId); // Gọi API cập nhật
      setShowUpdateForm(false); // Đóng form sau khi cập nhật
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

  return (
    <div className="container">
      <div className="filterContainer">
        <input
          type="text"
          placeholder="Search users..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full md:w-1/2 px-4 py-2 text-lg"
        />
        {renderDropdown(
          "Vai trò",
          permissionFilter,
          [
            { label: "Tất cả", value: "ALL" },
            { label: "Quản trị viên", value: "ADMIN" },
            { label: "Làm vườn", value: "GARDENER" },
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

        <button onClick={() => setShowAddForm(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
        >
          Add
        </button>
        <button onClick={handleDeleteUsers} disabled={selectedUsers.length === 0}
          className="bg-orange-600 text-white px-4 py-2 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
        >Delete</button>
      </div>

      <div className="tableContainer" >
        <table className="userTable">
          <thead>
            <tr>
              <th>  </th>
              <th>Tên</th> {/* name: string; */}
              <th>Email</th> {/* email: string; */}
              <th>Khu vực</th> {/* address: string; */}
              <th>Số điện thoại</th>  {/* phone: string; */}
              {/* <th>Ngày vào</th>  updatedAt: Date; */}
              <th>Vai trò</th> {/* role: string; */}
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.userId)}
                      onChange={() => toggleSelectUser(user.userId)}
                      className="w-5 h-5"
                    />
                  </td>
                  <td>
                    <button
                      // onClick={() => handleUpdateUsertest(user.userId)}
                      onClick={() => {
                        const upuser: UpdateUserType = {
                          userId: user.userId,
                          name: user.name,
                          email: user.email,
                          locationId: user.locationName,
                          phone: user.phone,
                          role: user.role,
                          password: "password123",
                        };
                        handleOpenUpdateForm(upuser);
                      }}
                      className="text-blue-500 hover:underline hover:text-blue-700"
                    >
                      {user.name}
                    </button>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.locationName}</td>
                  <td>{user.phone}</td>
                  {/* <td>{user.updatedAt}</td> */}
                  <td>
                    {/* Badge màu cho quyền */}
                    <span className={`permissionBadge ${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="noResults">
                  No matching users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPageChange={(e) => {
          setFirst(e.first);
          setRows(e.rows);
        }}
      />

      {showAddForm && (
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
          // placeholder="Location"
          >
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
          // placeholder="Role"
          >
            <option value="GARDENER">Gardener</option>
            <option value="ADMIN">Admin</option>
          </select>

          <div className="modalActions">
            <button onClick={handleCreateUser} className="bg-green-500 text-white px-4 py-2 rounded">
              Create User
            </button>
            <button onClick={() => setShowAddForm(false)} className="bg-red-500 text-white px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </PopupModal>
      )}

      {showUpdateForm && updatedUser && (
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
            value={updatedUser.locationId}  // Đảm bảo sử dụng locationId
            onChange={handleChange}
          >
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
      )}
    </div>
  );
}
