import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}


// export class ResendCodeDto {
//     @IsEmail({}, { message: 'Email không hợp lệ.' })
//     @IsNotEmpty({ message: 'Email không được để trống.' })
//     email: string;
// }

// export class ResetPasswordDto {
//     @IsEmail({}, { message: 'Email không hợp lệ.' })
//     @IsNotEmpty({ message: 'Email không được để trống.' })
//     email: string;

//     @IsString({ message: 'Mã xác thực phải là chuỗi.' })
//     @IsNotEmpty({ message: 'Mã xác thực không được để trống.' })
//     code: string;

//     @IsString({ message: 'Mật khẩu phải là chuỗi.' })
//     @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
//     @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
//     password: string;

//     @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi.' })
//     @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống.' })
//     password_confirm: string;
// }

export class ChangePasswordDto {
    @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi.' })
    @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống.' })
    currentPassword: string;

    @IsString({ message: 'Mật khẩu mới phải là chuỗi.' })
    @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
    @IsNotEmpty({ message: 'Mật khẩu mới không được để trống.' })
    newPassword: string;

    @IsString({ message: 'Xác nhận mật khẩu mới phải là chuỗi.' })
    @IsNotEmpty({ message: 'Xác nhận mật khẩu mới không được để trống.' })
    newPasswordConfirm: string;
}