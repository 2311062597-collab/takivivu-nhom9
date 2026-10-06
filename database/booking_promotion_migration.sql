USE booking_db;

ALTER TABLE bookings
  ADD COLUMN tong_tien_goc DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER khach_hang_id,
  ADD COLUMN uu_dai_id BIGINT NULL AFTER tong_tien,
  ADD COLUMN ma_uu_dai VARCHAR(50) NULL AFTER uu_dai_id,
  ADD COLUMN so_tien_giam DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER ma_uu_dai;

UPDATE bookings
SET tong_tien_goc = tong_tien
WHERE tong_tien_goc = 0;

ALTER TABLE booking_items
  ADD COLUMN nha_cung_cap_id BIGINT NULL AFTER dich_vu_id;

CREATE INDEX idx_booking_promotion ON bookings(uu_dai_id);
