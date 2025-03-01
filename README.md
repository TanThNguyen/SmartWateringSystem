# Smart Watering System

## ⚙️ Cài đặt và sử dụng

### Yêu cầu hệ thống:
- Node.js >= 20.x
- NPM >= 7.x hoặc Yarn
- PostgreSQL Server

### Cách cài đặt

1. **Clone repository:**
    ```bash
    git clone https://github.com/TanThNguyen/SmartWateringSystem.git
    cd SmartWateringSystem
2. **Cài đặt dependencies:**
    - Frontend:
        cd frontend
        npm install
    - Backend:
        cd backend
        npm install
3. **Chạy ứng dụng:**
    - Backend:
        cd backend
        npm run start:dev
    - Frontend:
        cd frontend
        npm run dev

## 📂 Cấu trúc thư mục
project-root/
├── frontend/       # Giao diện người dùng
│   ├── src/
│   └── public/
├── backend/        # Dịch vụ backend
│   ├── src/
│   └── prisma/     # Tệp cấu hình database
├── README.md
