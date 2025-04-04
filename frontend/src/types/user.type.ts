
//yêu cầu danh sách
export type UsersRequestType = {

    page: number;
    items_per_page: number;
    search?: string;
    role?: string; // 'ADMIN', 'GARDENER', 'INACTIVE', 'ALL'
    order?: string; // 'asc' or 'desc'
    locationId?: string;

}


//thông tin người dùng
export type InfoUsersType = {
    userId: string;
    name: string;
    email: string;
    locationId: string;
    phone: string;
    role: string; // 'ADMIN', 'GARDENER', 'INACTIVE', 'ALL'
    updatedAt: Date;

}


//danh sách người dùng
export type AllUsersType = {

    users: InfoUsersType[];
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    lastPage: number;

}


//tạo nugòi dùng
export type CreateUserType = {

    name: string;
    email: string;
    locationId: string;
    phone: string;
    role: string; // 'ADMIN', 'GARDENER', 'INACTIVE', 'ALL'
    password: string;
}


//cập nhat người dùng
export type UpdateUserType = {

    userId: string;
    name: string;
    email: string;
    locationId: string;
    phone: string;
    role: string; // 'ADMIN', 'GARDENER', 'INACTIVE', 'ALL'
    password: string;
}

