PHẦN 4.1 - ADMIN SETTINGS -> auth_db.cai_dat_he_thong

Copy đè/chép mới đúng theo cấu trúc thư mục trong ZIP.
Không cần chạy SQL mới: bảng cai_dat_he_thong đã có trong auth_db.

API mới:
GET /api/auth/admin/settings
PUT /api/auth/admin/settings

Frontend không còn dùng localStorage key takivivu_admin_ui_settings.

Kiểm tra:
1. Khởi động auth-service.
2. Đăng nhập ADMIN -> Cài đặt hệ thống.
3. Sửa tên/màu/cấu hình -> Lưu.
4. MySQL: SELECT khoa, gia_tri, nguoi_cap_nhat_id, ngay_cap_nhat FROM auth_db.cai_dat_he_thong;

Frontend TypeScript: đã chạy npx tsc --noEmit và pass.
Backend Maven: chưa xác nhận build trong môi trường này vì Maven Wrapper cần tải Maven 3.9.16 từ Internet và bị chặn.
