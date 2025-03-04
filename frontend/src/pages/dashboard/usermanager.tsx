import { useEffect, useState } from "react";

export default function UserManagementPage() {
  const [username, setUsername] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [permissionFilter, setPermissionFilter] = useState("All");
  const [joinedFilter, setJoinedFilter] = useState("Anytime");

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

  const getYearFromDate = (dateString) => {
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

  // Danh sách năm gia nhập cho dropdown (đảm bảo dropdown luôn "bằng bảng")
  const joinedYears = [
    "Anytime",
    ...new Set(filteredUsers.map((user) => getYearFromDate(user.joined))),
  ];

  return (
    <div className="container">
      <h2 className="welcome">Welcome, {username}!</h2>

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="filterContainer">
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
          <option value="All">Permissions: All</option>
          <option value="Admin">Permissions: Admin</option>
          <option value="Contributor">Permissions: Contributor</option>
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
      </div>

      {/* Bảng hiển thị danh sách người dùng */}
      <div className="tableContainer">
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
                  <td>{user.permission}</td>
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
        .container {
          padding: 20px;
          font-family: Arial, sans-serif;
          background-color: #fafafa;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .welcome {
          margin-bottom: 20px;
          color: #333;
        }

        .filterContainer {
          margin-bottom: 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          width: 100%;
          justify-content: center;
        }

        .searchInput,
        .selectInput {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        .tableContainer {
          background: #fff;
          border-radius: 8px;
          overflow-y: auto;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          /* Thay đổi từ max-height sang height để giữ kích thước cố định */
          height: 591px;
          width: 90%;
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

        /* Fixed header when scrolling */
        .userTable thead {
          position: sticky;
          top: 0;
          background-color: #f7f7f7;
          z-index: 1;
        }

        .userTable thead th {
          font-weight: 600;
          color: #555;
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

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .userTable th,
          .userTable td {
            padding: 10px;
          }

          .filterContainer {
            flex-direction: column;
            align-items: center;
          }

          .tableContainer {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
