-- Fix lỗi: Unknown column ks1_0.email / so_dien_thoai / hinh_anh
USE hotel_db;

ALTER TABLE khach_san ADD COLUMN IF NOT EXISTS so_dien_thoai VARCHAR(20) NULL AFTER thanh_pho;
ALTER TABLE khach_san ADD COLUMN IF NOT EXISTS email VARCHAR(254) NULL AFTER so_dien_thoai;
ALTER TABLE khach_san ADD COLUMN IF NOT EXISTS hinh_anh TEXT NULL AFTER email;
