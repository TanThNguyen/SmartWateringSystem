# 🌿 Smart Watering System - Hệ thống tưới cây thông minh IoT kết hợp AI

## 📌 Giới thiệu

Dự án xây dựng một hệ thống tưới cây thông minh, kết hợp IoT và AI để tối ưu hoá lượng nước sử dụng, giúp cây phát triển khỏe mạnh mà không tốn công sức giám sát thủ công. Hệ thống có thể thu thập dữ liệu từ các cảm biến và đưa ra quyết định tưới dựa trên **logic điều kiện** hoặc **dự đoán của mô hình AI**.

---

## ✨ Tính năng chính

- Giám sát liên tục độ ẩm đất, nhiệt độ, độ ẩm không khí.
- Hiển thị thông tin trực tiếp lên màn hình LCD.
- Tự động điều khiển bơm qua relay dựa trên:
  - Quy tắc thủ công cấu hình.
  - **Mô hình AI (nếu bật chế độ AI)**.
- Giao diện Web hiển thị dữ liệu real-time và điều khiển thiết bị từ xa.
- Biểu đồ trực quan quá trình tưới và môi trường.
- Tích hợp MQTT để giao tiếp giữa thiết bị và server (ở môi trường dev).
- Cấu hình Last Will & Testament (LWT) cho MQTT nhằm phát hiện mất kết nối bất thường từ thiết bị. Tuy nhiên, **Adafruit IO không hỗ trợ hoặc đang gặp lỗi nên chưa hoạt động ổn định**.
- Chế độ dự phòng REST API để giao tiếp giữa thiết bị và server khi không sử dụng MQTT.
- **Tích hợp mô-đun AI** để dự đoán nhu cầu tưới cây dựa trên dữ liệu lịch sử.

---

## 🛠️ Công nghệ sử dụng

### 🔧 Phần cứng (IoT):
- Yolobit (ESP32)
- Cảm biến độ ẩm đất
- Cảm biến DHT20 (nhiệt độ + độ ẩm không khí)
- Relay + bơm mini DC
- Màn hình LCD 16x2 I2C

### 💻 Phần mềm:
- **Frontend**: ReactJS, TailwindCSS, PrimeReact, Recharts
- **Backend**: NestJS, PostgreSQL, Axios, REST API
- **AI Module**:
  - Python + Scikit-learn / Rule-based logic
  - Dự đoán hành vi tưới dựa vào dữ liệu môi trường
- **MQTT Broker**: Adafruit IO (dev only)
- **Giao tiếp thiết bị**: MQTT (dev), REST API (prod)

---

## 🤖 Mô-đun AI

- Nằm trong thư mục `SmartWateringSystem/AI`
- Vai trò:
  - Huấn luyện mô hình dự đoán thời điểm tưới tối ưu dựa vào dữ liệu môi trường
  - Dự đoán kết quả và truyền cho Backend thông qua REST hoặc file trung gian
- Có thể dễ dàng mở rộng:
  - Học máy có giám sát (Supervised Learning)
  - Rule-based hoặc fuzzy logic tùy cấu hình
- Tích hợp pipeline xử lý dữ liệu + huấn luyện + xuất mô hình

---

## 🚀 Cài đặt và sử dụng

### 1. Clone dự án

```bash
git clone https://github.com/TanThNguyen/SmartWateringSystem.git
cd SmartWateringSystem
```
### 2. Backend
```bash
cd Backend
npm install
# Thêm file .env (xem .env.example)
npm run start:dev
```
### 3. Frontend
```bash
cd Frontend
npm install
npm run dev
```
### 3. AI model
```bash
cd ai-assistant
pip install -r requirements.txt
cd ./app
python train_pump_model.py
```

---

## Cấu trúc thư mục
```bash
SmartWateringSystem/
│
├── Backend/            # API, MQTT, xử lý dữ liệu, giao tiếp DB
│
├── Frontend/           # Giao diện người dùng React
│
├── ai-assistant/
│
├── docs/               # Tài liệu mô tả hệ thống
│
└── README.md
```

