USE auth_db;

-- Source TAKIVIVU được đồng bộ theo schema hiện tại của auth_db:
-- nguoi_dung_id, het_han_luc, da_su_dung, ngay_tao, ngay_su_dung.
-- Script này chỉ kiểm tra; KHÔNG cần tạo lại bảng và KHÔNG làm mất dữ liệu.
SHOW COLUMNS FROM password_reset_tokens;

-- Nếu DB của bạn thiếu bất kỳ cột tiếng Việt nào ở trên, hãy import lại auth_db.sql
-- hoặc bổ sung đúng cột trước khi chạy auth-service. Các cột English đã thêm trước đó
-- (created_at/expires_at/used_at) có thể giữ lại, source mới không phụ thuộc chúng.
