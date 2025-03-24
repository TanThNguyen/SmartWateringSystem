import { useEffect, useState } from "react";
import { AllUsersType, UsersRequestType, CreateUserType, UpdateUserType } from "../../types/user.type";
import { userApi } from "../../axios/user.api";


const UserList = () => {
    const [usersData, setUsersData] = useState<AllUsersType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: UsersRequestType = {
                page: 1,
                items_per_page: 10,
                search: "",
                role: "ALL",
                order: "asc",
            };
            const data = await userApi.getAllUsers(params);
            setUsersData(data);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách người dùng:", error);
            setError("Không thể tải danh sách người dùng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async () => {
        const newUser: CreateUserType = {
            name: "Người dùng mới",
            email: `newuser${Date.now()}@example.com`,
            locationId: "Địa chỉ mới",
            phone: "0123456789",
            password: "password123",
            role: "USER",
        };
        try {
            await userApi.createUser(newUser);
            fetchUsers();
        } catch (error) {
            console.error("Lỗi khi tạo người dùng:", error);
        }
    };

    const handleUpdateUser = async (userId: string) => {
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

    const toggleSelectUser = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Danh sách người dùng</h2>
            <button onClick={handleCreateUser}>Thêm người dùng</button>
            <button onClick={handleDeleteUsers} disabled={selectedUsers.length === 0}>
                Xóa đã chọn
            </button>
            {usersData?.users.map((user) => (
                <div key={user.userId}>
                    <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.userId)}
                        onChange={() => toggleSelectUser(user.userId)}
                    />
                    <p>Tên: {user.name}</p>
                    <p>Email: {user.email}</p>
                    <p>Vai trò: {user.role}</p>
                    <button onClick={() => handleUpdateUser(user.userId)}>Cập nhật</button>
                    <hr />
                </div>
            ))}
        </div>
    );
};

export default UserList;
