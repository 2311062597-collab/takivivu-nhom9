# Quên mật khẩu và PayOS

## Cập nhật cơ sở dữ liệu

Chạy sau khi đã import `auth_db.sql` và `payment_db.sql` từ bộ dữ liệu của dự án:

1. `database/migrations/password_reset_migration.sql`
2. `database/migrations/payos_migration.sql`

Các lệnh `ALTER TABLE` chỉ cần chạy một lần trên cơ sở dữ liệu hiện có.

## Cấu hình email (auth-service)

Đặt biến môi trường `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `AUTH_RESET_FRONTEND_URL` trước khi chạy `auth-service`. URL mặc định là `http://localhost:5173/reset-password`. Tài khoản SMTP phải cho phép gửi email. Luồng gồm `/forgot-password` → email có liên kết 15 phút → `/reset-password`; mỗi token chỉ dùng một lần.

## Cấu hình PayOS (payment-service)

Lấy **Client ID**, **API Key** và **Checksum Key** từ kênh thanh toán của bạn trên my.payos.vn, rồi đặt biến môi trường `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`. Đặt `PAYOS_RETURN_URL` và `PAYOS_CANCEL_URL` thành URL trang thanh toán của frontend, ví dụ `https://ten-mien-cua-ban/payments/new`. Hệ thống sẽ tự thêm `bookingId` vào URL.

Đăng ký webhook công khai, có HTTPS, tại `https://ten-mien-api-cua-ban/api/payments/payos/webhook` trong PayOS. URL này phải đi tới `payment-service` qua API gateway. Webhook kiểm tra HMAC, mã đơn, số tiền VND và payment link trước khi xác nhận Booking. Redirect trình duyệt chỉ hiển thị trạng thái, không tự xác nhận thanh toán.

Chạy frontend với `npm install` rồi `npm run dev`; chạy các service Java như hướng dẫn sẵn của dự án. PayOS cần thông tin kênh thanh toán thật và URL webhook truy cập được từ Internet để kiểm thử giao dịch đầu cuối.
