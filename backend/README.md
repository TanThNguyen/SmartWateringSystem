# Backend using Nestjs + Prisma
## Project structure:
- `src`: dùng để tạo các thư mục như auth, user và tạo các file như: controller, service và module.
- `prisma`: dùng để viết các model (giống viết các relation trong database)
## Hướng dẫn chạy và các lệnh cơ bản:
- `npm install`: sau khi pull code về để tải các tài nguyên.
<<<<<<< HEAD
- Trong thư mục `src`: tạo file `.env`, trong file này điền các thông tin sau:
    - DATABASE_URL="postgresql://<your_username>:<your_password>@<your_database_domain>:<your_port>/<your_database_name>?schema=public"
    - JWT_SECRET=
    - PORT=
Docker:
    POSDB_ROOT_PASSWORD=
    POSDB_USER=
    POSDB_PASSWORD=
    POSDB_DATABASE=
    POSDB_LOCAL_PORT=
    POSDB_DOCKER_PORT=

- `npx prisma migrate dev --name init`: để migrate prisma.schema vào database trống.
- `npm run start:dev`: khởi động server.
- `npx prisma studio`: hiển thị phần database.
- `ts-node prisma/seed.ts`: generate data from seed.ts
- `nest g module <folder name>`: nestjs sẽ tự động folder có tên là <folder_name> cho chúng ta trong thư mục `src`, bao gồm file `module`.
- `nest g controller <folder name>`: nestjs sẽ tự động folder có tên là <folder_name> cho chúng ta trong thư mục `src`, bao gồm file `controller`.
- `nest g service <folder name>`: nestjs sẽ tự động folder có tên là <folder_name> cho chúng ta trong thư mục `src`, bao gồm file `service`.

## Hướng dẫn code:
- Code rõ ràng
- Documentation of nestjs: [https://docs.nestjs.com/]
- Đối với mỗi module trong `src` sẽ bao gồm:
    - `<file_name>.module.ts`: bao gồm
        - Providers: [] -> khi khởi tạo đã được thêm sẵn.
        - Controllers: [] -> khi khởi tạo đã được thêm sẵn.
    - `<file_name>.controller.ts`: được dùng để định nghĩa các API.
    - `<file_name>.service.ts`: được dùng để định nghĩa các hàm sử dụng cho controller.
    - Folder `dto`: được dùng để định nghĩa các class, interface, ...
