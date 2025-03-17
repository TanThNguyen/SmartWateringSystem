import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { userApi } from "../../axios/user.api";
import PopupModal from "../../layout/popupmodal";
import {  UpdateUserType } from "../../types/user.type";


export default function UserManagementPage() {
  const [username, setUsername] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");

  const [permissionFilter, setPermissionFilter] = useState("All");
  const [joinedFilter, setJoinedFilter] = useState("Anytime");


  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updatedUser, setUpdatedUser] = useState<UpdateUserType | null>(null);
  
  // Người dùng được chọn để cập nhậ, để xóa
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);


  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    password: "",
    role: "USER",
  });

  // Dữ liệu người dùng mô phỏng
  const usersData = [
    {
      userId: "1",
      name: "Leslie Maya",
      email: "leslie@gmail.com",
      phone: "1234567890",
      address: "Los Angeles, CA",
      updatedAt: "October 2, 2010",
      role: "Admin",
    },
    {
      userId: "2",
      name: "Josie Deck",
      email: "josie@gmail.com",
      phone: "1234567890",
      address: "Cheyenne, WY",
      updatedAt: "May 20, 2015",
      role: "Admin",
    },
    {
      userId: "3",
      name: "Alex Pfeiffer",
      email: "alex@gmail.com",
      phone: "1234567890",
      address: "Cheyenne, WY",
      updatedAt: "May 20, 2015",
      role: "Admin",
    },
    {
      userId  : "4",
      name: "Mike Dean",
      email: "mike@gmail.com",
      phone: "1234567890",
      address: "New York, NY",
      updatedAt: "July 14, 2015",
      role: "Admin",
    },
    {
      userId: "5",
      name: "Mateus Cunha",
      email: "mcunha@gmail.com",
      phone: "1234567890",
      address: "Luanda, Angola",
      updatedAt: "June 10, 2016",
      role: "Gardener",
    },
    {
      userId: "6",
      name: "Nave Loma",
      email: "nave@gmail.com",
      phone: "1234567890",
      address: "Paris, FR",
      updatedAt: "February 13, 2018",
      role: "Gardener",
    },
    {
      userId: "7",
      name: "Antony Mack",
      email: "antony@gmail.com",
      phone: "1234567890",
      address: "London, ENG",
      updatedAt: "June 15, 2019",
      role: "Gardener",
    },
    {
      userId: "8",
      name: "Adriana da Silva",
      email: "adri@gmail.com",
      phone: "1234567890",
      address: "Rio de Janeiro, BR",
      updatedAt: "March 14, 2018",
      role: "Gardener",
    },
    {
      userId: "9",
      name: "Jorge Ferreira",
      email: "jorge@gmail.com",
      phone: "1234567890",
      address: "Huambo, Angola",
      updatedAt: "May 16, 2018",
      role: "INACTIVE",
    },
    {
      userId: "10",
      name: "Mateus Cunha",
      email: "mcunha@gmail.com",
      phone: "1234567890",
      address: "Luanda, Angola",
      updatedAt: "June 10, 2016",
      role: "INACTIVE",
    },
    {
      userId: "11",
      name: "Nave Loma",
      email: "nave@gmail.com",
      phone: "1234567890",
      address: "Paris, FR",
      updatedAt: "February 13, 2018",
      role: "INACTIVE",
    },
    {
      userId: "12",
      name: "Antony Mack",
      email: "antony@gmail.com",
      phone: "1234567890",
      address: "London, ENG",
      updatedAt: "June 15, 2019",
      role: "INACTIVE",
    },
    {
      userId: "13",
      name: "Adriana da Silva",
      email: "adri@gmail.com",
      phone: "1234567890",
      address: "Rio de Janeiro, BR",
      updatedAt: "March 14, 2018",
      role: "INACTIVE",
    },
    {
      userId: "14",
      name: "Jorge Ferreira",
      email: "jorge@gmail.com",
      phone: "1234567890",
      address: "Huambo, Angola",
      updatedAt: "May 16, 2018",
      role: "INACTIVE",
    }
  ];

  // Lấy username từ localStorage (nếu có)
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  const getYearFromDate = (dateString:string) => {
    const parts = dateString.split(" ");
    return parts.length >= 3 ? parts[2].replace(",", "") : "";
  };

  // Lọc người dùng theo tìm kiếm, quyền và năm gia nhập
  const filteredUsers = usersData.filter((user) => {
    const inSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.address.toLowerCase().includes(searchTerm.toLowerCase());

    if (!inSearch) return false;

    // Lọc theo quyền nếu khác "All"
    if (permissionFilter !== "All" && user.role !== permissionFilter) {
      return false;
    }

    // Lọc theo năm gia nhập nếu khác "Anytime"
    if (joinedFilter !== "Anytime") {
      const userYear = getYearFromDate(user.updatedAt);
      if (userYear !== joinedFilter) {
        return false;
      }
    }

    return true;
  });

  // Tạo danh sách năm gia nhập cho dropdown
  // Đảm bảo có "Anytime" và chỉ hiển thị năm có trong filteredUsers
  const joinedYears = [
    "Anytime",
    ...new Set(filteredUsers.map((user) => getYearFromDate(user.updatedAt))),
  ];





  const fetchUsers = () => {
    console.log("Fetching users...");
  };


  // Xử lý thay đổi giá trị của form thêm user
  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  // Hàm tạo người dùng mới khi submit form
  const handleCreateUser = async () => {
    try {
      await userApi.createUser(newUser);
      fetchUsers();
      setShowAddForm(false);
      setNewUser({
        name: "",
        email: "",
        address: "",
        phone: "",
        password: "",
        role: "USER",
      });
      toast.success("Người dùng mới đã được tạo thành công!");
    } catch (error) {
      console.error("Lỗi khi tạo người dùng:", error);
      toast.error("Lỗi khi tạo người dùng");
    }
  };

  // hàm chọn
  // const handleSelectUser = (userId: string) => {
  //   setSelectedUsers((prevSelected) =>
  //     prevSelected.includes(userId)
  //       ? prevSelected.filter((id) => id !== userId)
  //       : [...prevSelected, userId] 
  //   );
  // };
  // hàm xóa
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
         address: "Địa chỉ cập nhật",
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


 const handleUpdateUser = async ( updatedUser: UpdateUserType) => {
  
  try {
      await userApi.updateUser(updatedUser);
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
      handleUpdateUser(updatedUser); // Gọi API cập nhật
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




  return (
    <div className="container">
      
      {/* Nếu muốn giữ lại lời chào: */}
      {/* <h2 className="welcome">Welcome, {username}!</h2> */}

      {/* Thanh tìm kiếm + lọc + logo + nút Add */}
      <div className="filterContainer">
        {/* <div className="logoCircle">1</div> */}
        {/* //thanh tìm kiếm */}
        <input
          type="text"
          placeholder="Search (tên,email, địa chỉ)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 px-4 py-2 text-lg"
        />

        {/* //thanh lọc theo quyền */}
        <select
          value={permissionFilter}
          onChange={(e) => setPermissionFilter(e.target.value)}
          className="selectInput"
        >
          {/*     role: string; // 'ADMIN', 'GARDENER', 'INACTIVE', 'ALL' */}
          <option value="All">Role</option>
          <option value="Admin">Role Admin</option>
          <option value="GARDENER">Role GARDENER</option>
          <option value="INACTIVE">Role INACTIVE</option>
        </select>

        {/* //thanh lọc theo năm gia nhập */}
        <select
          value={joinedFilter}
          onChange={(e) => setJoinedFilter(e.target.value)}
          className="selectInput"
        >
          {joinedYears.map((year) => (
            <option key={year} value={year}>
              Joined {year}
            </option>
          ))}
        </select>

        <button onClick={() => setShowAddForm(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
          >
            Add
          </button>
        <button onClick={handleDeleteUsers} disabled={selectedUsers.length === 0}
        className="bg-orange-600 text-white px-4 py-2 rounded font-bold text-lg shadow-md transition-colors duration-200 hover:bg-orange-700"
        >Delete</button>
        

      </div>

      {/* Bảng hiển thị danh sách người dùng */}
      
      <div className="tableContainer" >
        <table className="userTable">
          <thead>
            <tr>
              <th>  </th>
              <th>Tên</th> {/* name: string; */}
              <th>Email</th> {/* email: string; */}
              <th>Địa chỉ</th> {/* address: string; */}
              <th>Số điện thoại</th>  {/* phone: string; */}
              <th>Ngày vào</th> {/*  updatedAt: Date; */}
              <th>Vai trò</th> {/* role: string; */}
            </tr>
          </thead>
          <tbody>
          {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
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
                          address: user.address,
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
                  <td>{user.address}</td>
                  <td>{user.phone}</td>
                  <td>{user.updatedAt}</td>

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
      {showAddForm && (
        <PopupModal title="Thêm người dùng" onClose={() => setShowAddForm(false)}>
          <label>
            Tên:
            {/* name: string */}
            <input
              type="text"
              name="name"
              value={newUser.name}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            Email:
            {/* email: string */}
            <input
              type="email"
              name="email"
              value={newUser.email}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            Địa chỉ:
            {/* address: string */}
            <input
              type="text"
              name="address"
              value={newUser.address}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            Số điện thoại:
            {/* phone: string */}
            <input
              type="text"
              name="phone"
              value={newUser.phone}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            {/* pasword: string */}
            Password:
            <input
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            Role:
            {/* role: string; // 'ADMIN', 'GARDENER', 'INACTIVE', 'ALL' */}
            <select
              name="role"
              value={newUser.role}
              onChange={handleNewUserChange}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="GARDENER">GARDENER</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          <div className="flex justify-between mt-4 w-full">

            <button onClick={handleCreateUser} 
            className="px-6 py-2 border-2 border-orange-500 text-orange-500 font-bold rounded-lg shadow-lg hover:bg-orange-500 hover:text-white transition-all duration-200"
            >Create</button>

            <button onClick={() => setShowAddForm(false)}
            className="px-6 py-2 border-2 border-orange-500 text-orange-500 font-bold rounded-lg shadow-lg hover:bg-orange-500 hover:text-white transition-all duration-200"
            >Cancel</button>
           
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
          <label>
            Địa chỉ:
            <input
              type="text"
              name="address"
              value={updatedUser.address}
              onChange={handleChange}
            />
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

        .permissionBadge.gardener {
          color: #3498db;
        }
        .permissionBadge.inactive {
          color: #f39c12;
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
    </div>
  );
}
