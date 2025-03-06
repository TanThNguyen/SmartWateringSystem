import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { userAPI } from "../../axios/user.api";
import PopupModal from "../../layout/popupmodal";


export default function UserManagementPage() {
  const [username, setUsername] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [permissionFilter, setPermissionFilter] = useState("All");
  const [joinedFilter, setJoinedFilter] = useState("Anytime");

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
  const users = [
    {
      fullName: "Leslie Maya",
      email: "leslie@gmail.com",
      location: "Los Angeles, CA",
      joined: "October 2, 2010",
      permission: "Admin",
    },
    {
      fullName: "Josie Deck",
      email: "josie@gmail.com",
      location: "Cheyenne, WY",
      joined: "May 20, 2015",
      permission: "Admin",
    },
    {
      fullName: "Alex Pfeiffer",
      email: "alex@gmail.com",
      location: "Cheyenne, WY",
      joined: "May 20, 2015",
      permission: "Admin",
    },
    {
      fullName: "Mike Dean",
      email: "mike@gmail.com",
      location: "New York, NY",
      joined: "July 14, 2015",
      permission: "Admin",
    },
    {
      fullName: "Mateus Cunha",
      email: "mcunha@gmail.com",
      location: "Luanda, Angola",
      joined: "June 10, 2016",
      permission: "Contributor",
    },
    {
      fullName: "Nave Loma",
      email: "nave@gmail.com",
      location: "Paris, FR",
      joined: "February 13, 2018",
      permission: "Contributor",
    },
    {
      fullName: "Antony Mack",
      email: "antony@gmail.com",
      location: "London, ENG",
      joined: "June 15, 2019",
      permission: "Contributor",
    },
    {
      fullName: "Adriana da Silva",
      email: "adri@gmail.com",
      location: "Rio de Janeiro, BR",
      joined: "March 14, 2018",
      permission: "Contributor",
    },
    {
      fullName: "Jorge Ferreira",
      email: "jorge@gmail.com",
      location: "Huambo, Angola",
      joined: "May 16, 2018",
      permission: "Contributor",
    },
    // Dữ liệu trùng lặp nếu cần
    {
      fullName: "Leslie Maya",
      email: "leslie@gmail.com",
      location: "Los Angeles, CA",
      joined: "October 2, 2010",
      permission: "Admin",
    },
    {
      fullName: "Josie Deck",
      email: "josie@gmail.com",
      location: "Cheyenne, WY",
      joined: "May 20, 2015",
      permission: "Admin",
    },
    {
      fullName: "Alex Pfeiffer",
      email: "alex@gmail.com",
      location: "Cheyenne, WY",
      joined: "May 20, 2015",
      permission: "Admin",
    },
    {
      fullName: "Mike Dean",
      email: "mike@gmail.com",
      location: "New York, NY",
      joined: "July 14, 2015",
      permission: "Admin",
    },
    {
      fullName: "Mateus Cunha",
      email: "mcunha@gmail.com",
      location: "Luanda, Angola",
      joined: "June 10, 2016",
      permission: "Contributor",
    },
    {
      fullName: "Nave Loma",
      email: "nave@gmail.com",
      location: "Paris, FR",
      joined: "February 13, 2018",
      permission: "Contributor",
    },
    {
      fullName: "Antony Mack",
      email: "antony@gmail.com",
      location: "London, ENG",
      joined: "June 15, 2019",
      permission: "Contributor",
    },
    {
      fullName: "Adriana da Silva",
      email: "adri@gmail.com",
      location: "Rio de Janeiro, BR",
      joined: "March 14, 2018",
      permission: "Contributor",
    },
    {
      fullName: "Jorge Ferreira",
      email: "jorge@gmail.com",
      location: "Huambo, Angola",
      joined: "May 16, 2018",
      permission: "Contributor",
    },
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
  const filteredUsers = users.filter((user) => {
    const inSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!inSearch) return false;

    // Lọc theo quyền nếu khác "All"
    if (permissionFilter !== "All" && user.permission !== permissionFilter) {
      return false;
    }

    // Lọc theo năm gia nhập nếu khác "Anytime"
    if (joinedFilter !== "Anytime") {
      const userYear = getYearFromDate(user.joined);
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
    ...new Set(filteredUsers.map((user) => getYearFromDate(user.joined))),
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
      await userAPI.createUser(newUser);
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


  return (
    <div className="container">
      {/* Nếu muốn giữ lại lời chào: */}
      {/* <h2 className="welcome">Welcome, {username}!</h2> */}

      {/* Thanh tìm kiếm + lọc + logo + nút Add */}
      <div className="filterContainer">
        <div className="logoCircle">1</div>

        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="searchInput"
        />

        <select
          value={permissionFilter}
          onChange={(e) => setPermissionFilter(e.target.value)}
          className="selectInput"
        >
          <option value="All">Permissions All</option>
          <option value="Admin">Permissions Admin</option>
          <option value="Contributor">Permissions Contributor</option>
        </select>

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
      
        {showAddForm && (
        <PopupModal title="Add New User" onClose={() => setShowAddForm(false)}>
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={newUser.name}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={newUser.email}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            Address:
            <input
              type="text"
              name="address"
              value={newUser.address}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
            Phone:
            <input
              type="text"
              name="phone"
              value={newUser.phone}
              onChange={handleNewUserChange}
            />
          </label>
          <label>
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
            <select
              name="role"
              value={newUser.role}
              onChange={handleNewUserChange}
            >
              value="USER"
            </select>
          </label>
          <div>
            <button onClick={handleCreateUser}>Create</button>
            <button onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </PopupModal>
      )}

      </div>

      {/* Bảng hiển thị danh sách người dùng */}
      <div className="tableContainer" >
        <table className="userTable">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Location</th>
              <th>Joined</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.location}</td>
                  <td>{user.joined}</td>
                  <td>
                    {/* Badge màu cho quyền */}
                    <span className={`permissionBadge ${user.permission.toLowerCase()}`}>
                      {user.permission}
                    </span>
                  </td>
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

      <style jsx>{`
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
          padding: 8px;
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
          height: 591px; 
          width: 90%;
          margin-bottom: 20px;
          position: relative;
          z-index: 20;
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
    </div>
  );
}
