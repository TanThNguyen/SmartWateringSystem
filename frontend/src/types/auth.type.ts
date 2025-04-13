export interface LoginType {

    email: string;
    password: string;

}

export interface ChangePasswordType {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
}

export interface ChangePasswordSuccessResponse {
    message: string;
}