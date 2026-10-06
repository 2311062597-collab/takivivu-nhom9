-- TAKIVIVU - Đồng bộ schema với source hiện tại (MySQL 8+)
-- Chạy 1 lần sau các file tạo database gốc. Các câu lệnh dưới đây có thể chạy lại an toàn.

USE booking_db;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tong_tien_goc DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER khach_hang_id;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS uu_dai_id BIGINT NULL AFTER tong_tien;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ma_uu_dai VARCHAR(50) NULL AFTER uu_dai_id;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS so_tien_giam DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER ma_uu_dai;
ALTER TABLE booking_items ADD COLUMN IF NOT EXISTS nha_cung_cap_id BIGINT NULL AFTER dich_vu_id;
UPDATE bookings SET tong_tien_goc=tong_tien WHERE tong_tien_goc IS NULL OR tong_tien_goc=0;

-- Backfill provider cho booking cũ từ đúng service sở hữu dịch vụ.
UPDATE booking_db.booking_items bi
JOIN flight_db.flights f ON bi.loai_dich_vu='FLIGHT' AND bi.dich_vu_id=f.id
SET bi.nha_cung_cap_id=f.nha_cung_cap_id
WHERE bi.nha_cung_cap_id IS NULL;
UPDATE booking_db.booking_items bi
JOIN hotel_db.hotels h ON bi.loai_dich_vu='HOTEL' AND bi.dich_vu_id=h.id
SET bi.nha_cung_cap_id=h.nha_cung_cap_id
WHERE bi.nha_cung_cap_id IS NULL;
UPDATE booking_db.booking_items bi
JOIN attraction_db.attractions a ON bi.loai_dich_vu='ATTRACTION' AND bi.dich_vu_id=a.id
SET bi.nha_cung_cap_id=a.nha_cung_cap_id
WHERE bi.nha_cung_cap_id IS NULL;

USE flight_db;
ALTER TABLE flights ADD COLUMN IF NOT EXISTS hang_ve VARCHAR(50) NOT NULL DEFAULT 'Phổ thông' AFTER thoi_gian_den;
UPDATE flights SET hang_ve='Phổ thông' WHERE hang_ve IS NULL OR TRIM(hang_ve)='';

USE promotion_db;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS image_url LONGTEXT NULL AFTER description;

-- Kiểm tra nhanh sau migration
SELECT 'booking_items_missing_provider' AS check_name, COUNT(*) AS problem_count
FROM booking_db.booking_items WHERE nha_cung_cap_id IS NULL
UNION ALL
SELECT 'promotions_missing_image_column', IF(EXISTS(
  SELECT 1 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='promotion_db' AND TABLE_NAME='promotions' AND COLUMN_NAME='image_url'
),0,1)
UNION ALL
SELECT 'flights_missing_ticket_class', COUNT(*)
FROM flight_db.flights WHERE hang_ve IS NULL OR TRIM(hang_ve)='';
