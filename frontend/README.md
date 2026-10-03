# TAKIVIVU Frontend

Frontend React + TypeScript + Vite được dựng theo 2 bộ Figma đã cung cấp và đối chiếu với source backend `takivivu (2).zip`.

## Chạy trên Windows PowerShell

```powershell
cd takivivu-frontend
npm install
npm run dev
```

Mở: `http://localhost:5173`

Backend cần chạy API Gateway tại `http://localhost:8080`. Vite proxy `/api` sang Gateway nên không cần sửa backend CORS khi chạy local.

## API thật đã kết nối

- Auth: đăng ký Customer/Provider, login, refresh token, logout, profile, duyệt Provider.
- Flight: search/detail + Provider CRUD.
- Hotel: search/detail/room + Provider hotel/room CRUD.
- Attraction: search/detail/ticket + Provider attraction/ticket CRUD.
- Booking: create, mine, detail, cancel.
- Payment: create payment, QR, status, history/detail/cancel/refund API module.
- Notification: list + mark read.
- AI: chat/recommend/help API module.
- Map: geocode/search/distance API module.

## Những phần KHÔNG dùng mock data

Backend hiện chưa có API Provider booking/revenue và chưa có Promotion/Review service. Các trang tương ứng hiển thị trạng thái "backend chưa hỗ trợ" thay vì tạo dữ liệu giả.

Payment backend chỉ có `QR_BANK_TRANSFER`; giao diện chạy thật chỉ kích hoạt phương thức này dù Figma có MoMo/VNPay/Card/ZaloPay.

Figma loại vé có một số ảnh cũ nhưng theo yêu cầu đã chốt và DTO backend, frontend không thêm field hình ảnh cho loại vé.
