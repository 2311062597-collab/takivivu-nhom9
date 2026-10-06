USE auth_db;

ALTER TABLE provider_profiles
  ADD COLUMN ten_viet_tat VARCHAR(150) NULL AFTER ten_doanh_nghiep,
  ADD COLUMN mo_ta TEXT NULL AFTER ten_viet_tat,
  ADD COLUMN ma_so_thue VARCHAR(50) NULL AFTER mo_ta,
  ADD COLUMN nam_thanh_lap VARCHAR(4) NULL AFTER ma_so_thue,
  ADD COLUMN website VARCHAR(500) NULL AFTER nam_thanh_lap,
  ADD COLUMN email_doanh_nghiep VARCHAR(255) NULL AFTER website,
  ADD COLUMN so_dien_thoai_doanh_nghiep VARCHAR(30) NULL AFTER email_doanh_nghiep,
  ADD COLUMN dia_chi_doanh_nghiep VARCHAR(500) NULL AFTER so_dien_thoai_doanh_nghiep,
  ADD COLUMN anh_bia VARCHAR(1000) NULL AFTER dia_chi_doanh_nghiep,
  ADD COLUMN logo VARCHAR(1000) NULL AFTER anh_bia;
