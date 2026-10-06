USE flight_db;

ALTER TABLE flights
  ADD COLUMN hang_ve VARCHAR(50) NOT NULL DEFAULT 'Phổ thông' AFTER thoi_gian_den;

UPDATE flights SET hang_ve = 'Phổ thông' WHERE hang_ve IS NULL OR TRIM(hang_ve) = '';
