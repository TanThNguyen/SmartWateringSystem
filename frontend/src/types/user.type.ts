export type UsersRequestType = {

    page: number;
    items_per_page: number;
    search?: string;
    role?: string; // 'ADMIN', 'GARDENER', 'INACTIVE', 'ALL'
    order?: string; // 'asc' or 'desc'

}

export type InfoUsersType = {
    userId: string;
    name: string;
    email: string;
    address: string;
    phone: string;
    role: string; // 'ADMIN', 'GARDENER', 'INACTIVE', 'ALL'
    updatedAt: Date;

}

export type AllUsersType = {

    users: InfoUsersType[];
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    lastPage: number;

}

export type CreateUserType = {

    name: string;
    email: string;
    address: string;
    phone: string;
    role: string; // 'ADMIN', 'GARDENER', 'INACTIVE', 'ALL'
    password: string;
}

export type UpdateUserType = {

    userId: string;
    name: string;
    email: string;
    address: string;
    phone: string;
    role: string; // 'ADMIN', 'GARDENER', 'INACTIVE', 'ALL'
    password: string;
}

