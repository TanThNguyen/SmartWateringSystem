import environment from "../environment";

export const handleAPIError = (error: any) => {
    if (environment.dev === "true") {
        console.error(error);
    }

    const message =
        error?.response?.data?.message ||
        "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.";
    alert(message);
};