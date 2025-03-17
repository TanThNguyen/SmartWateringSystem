import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PopupModal from "../../layout/popupmodal";
import { InfoUsersType } from "../../types/user.type";
import { userApi } from "../../axios/user.api";

export default function UserManagementPage() {
  const [username, setUsername] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [permissionFilter, setPermissionFilter] = useState("ALL");
  const [users, setUsers] = useState<InfoUsersType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    password: "",
    role: "GARDENER",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userApi.getAllUsers({ page: 1, items_per_page: 10, role: permissionFilter });
      setUsers(response.users);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách người dùng");
    }
  };

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async () => {
    try {
      await userApi.createUser(newUser);
      fetchUsers();
      setShowAddForm(false);
      setNewUser({ name: "", email: "", address: "", phone: "", password: "", role: "GARDENER" });
      toast.success("Người dùng mới đã được tạo thành công!");
    } catch (error) {
      toast.error("Lỗi khi tạo người dùng");
    }
  };

  return (
    <div className="container">
      <style>{`
        /* Container chính: đặt background, canh giữa, v.v. */
        .container {
          /* Thay link ảnh nền thật của bạn vào đây */
          background: url("https://images.unsplash.com/photo-1562075219-5356a05c8db5?fit=crop&w=1600&q=80")
            no-repeat center center fixed;
          background-size: cover;
          padding: 20px;
          font-family: Arial, sans-serif;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Logo hình tròn góc trái (nếu muốn) */
        .logoCircle {
          width: 30px;
          height: 30px;
          background-color: #e74c3c;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 10px;
        }

        /* Nếu muốn hiển thị tiêu đề chào */
        .welcome {
          margin-bottom: 20px;
          color: #fff;
          text-shadow: 1px 1px 2px #000;
        }

        /* Thanh chứa filter và nút Add */
        .filterContainer {
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 90%;
          padding: 10px;
          background-color: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(8px);
          border-radius: 8px;
        }

        /* Input tìm kiếm */
        .searchInput {
          flex: 1;
           padding: 6px 30px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        /* Dropdown chung */
        .selectInput {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          background-color: #fff;
          cursor: pointer;
        }

        /* Nút Add */
        .addButton {
          background-color: #2ecc71;
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        .addButton:hover {
          background-color: #27ae60;
        }

        /* Vùng chứa bảng */
        .tableContainer {
          background: rgba(255, 255, 255, 0.652);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          overflow-y: auto;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          height: 570px; 
          width: 90%;
          margin-bottom: 20px;

        }

        .userTable {
          width: 100%;
          border-collapse: collapse;
        }

        .userTable th,
        .userTable td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        /* Cố định header khi cuộn */
        .userTable thead {
          position: sticky;
          top: 0;
          background-color: #f7f7f7;
          z-index: 1;
        }

        .userTable thead th {
          font-weight: 600;
          color: #333;
        }

        .userTable tbody tr:hover {
          background-color: #f1f1f1;
          cursor: pointer;
        }

        .noResults {
          text-align: center;
          padding: 20px;
          color: #888;
        }

        /* Badge màu cho cột Permissions */
        .permissionBadge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          color: #fff;
          font-weight: bold;
        }
        .permissionBadge.admin {
          color: #e74c3c;
        }
        .permissionBadge.contributor {
          color: #52b45f; 
        }

        /* Responsive */
        @media (max-width: 768px) {
          .filterContainer {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .tableContainer {
            width: 100%;
            height: auto; /* Cho mobile dễ xem hơn */
            max-height: 591px;
          }
        }

        /* Popup Modal */
        .addButton {
          background-color: #2ecc71;
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        .addButton:hover {
          background-color: #27ae60;
        }
        .modalActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }
        label {
          display: block;
          margin-bottom: 10px;
        }
        input,
        select {
          width: 100%;
          padding: 8px;
          margin-top: 4px;
          margin-bottom: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
      `}</style>
      <div className="filterContainer">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 text-lg"
        />
        <select
          value={permissionFilter}
          onChange={(e) => setPermissionFilter(e.target.value)}
          className="selectInput"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="GARDENER">Gardener</option>
        </select>
        <button onClick={() => setShowAddForm(true)} className="bg-orange-600 text-white px-4 py-2 rounded font-bold">
          Add
        </button>
      </div>
      <div className="tableContainer">
        <table className="userTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={index}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.address}</td>
                  <td>{user.phone}</td>
                  <td>{user.role}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="noResults">
                  No matching users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showAddForm && (
        <PopupModal title="Add New User" onClose={() => setShowAddForm(false)}>
          <input type="text" name="name" value={newUser.name} onChange={handleNewUserChange} placeholder="Name" />
          <input type="email" name="email" value={newUser.email} onChange={handleNewUserChange} placeholder="Email" />
          <input type="text" name="address" value={newUser.address} onChange={handleNewUserChange} placeholder="Address" />
          <input type="text" name="phone" value={newUser.phone} onChange={handleNewUserChange} placeholder="Phone" />
          <input type="password" name="password" value={newUser.password} onChange={handleNewUserChange} placeholder="Password" />
          <select name="role" value={newUser.role} onChange={handleNewUserChange}>
            <option value="GARDENER">Gardener</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button onClick={handleCreateUser} className="px-6 py-2 bg-green-600 text-white font-bold rounded">Create</button>
        </PopupModal>
      )}
    </div>
  );
}
