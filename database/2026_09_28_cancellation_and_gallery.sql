-- TAKIVIVU - ban sua cho MySQL 8.x (khong ho tro ADD COLUMN IF NOT EXISTS)
-- Sao luu CSDL truoc khi chay. Ban nay bo qua cot/index da ton tai.
-- Chay toan bo file trong MySQL Workbench (Script -> Execute).

-- 1) BOOKING SERVICE
USE booking_db;

-- Cot ly_do_huy
SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'ly_do_huy'),
  'SELECT ''Bo qua: bookings.ly_do_huy da ton tai'' AS ket_qua',
  'ALTER TABLE bookings ADD COLUMN ly_do_huy VARCHAR(500) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Cot ly_do_tu_choi_huy
SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'ly_do_tu_choi_huy'),
  'SELECT ''Bo qua: bookings.ly_do_tu_choi_huy da ton tai'' AS ket_qua',
  'ALTER TABLE bookings ADD COLUMN ly_do_tu_choi_huy VARCHAR(500) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Cot han_xu_ly_huy
SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'han_xu_ly_huy'),
  'SELECT ''Bo qua: bookings.han_xu_ly_huy da ton tai'' AS ket_qua',
  'ALTER TABLE bookings ADD COLUMN han_xu_ly_huy DATETIME(6) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Trang thai booking moi (CANCEL_REQUESTED...) duoc luu duoi dang chuoi
-- Cho phep chuyen cot ENUM cu sang VARCHAR(50).
ALTER TABLE bookings MODIFY COLUMN trang_thai VARCHAR(50) NOT NULL;

-- Chi tao index neu chua co
SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND INDEX_NAME = 'idx_booking_cancel_timeout'),
  'SELECT ''Bo qua: idx_booking_cancel_timeout da ton tai'' AS ket_qua',
  'CREATE INDEX idx_booking_cancel_timeout ON bookings (trang_thai, han_xu_ly_huy)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) HOTEL SERVICE
USE hotel_db;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loai_phong' AND COLUMN_NAME = 'anh_thu_vien'),
  'SELECT ''Bo qua: loai_phong.anh_thu_vien da ton tai'' AS ket_qua',
  'ALTER TABLE loai_phong ADD COLUMN anh_thu_vien TEXT NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) NOTIFICATION SERVICE
USE notification_db;

-- Enum Java mo rong, chuyen cot type sang VARCHAR(50).
ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50) NOT NULL;

-- Payment Service: khong can them bang/cot cho luong hoan tien mo phong.
-- Su dung bang hoan_tien va cac trang thai thanh_toan da co trong source.
