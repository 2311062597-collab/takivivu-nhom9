-- TAKIVIVU - cho phép đánh giá độc lập theo từng đối tượng dịch vụ trong cùng booking.
-- Chạy sau 20261004_reviews.sql.

USE hotel_db;
ALTER TABLE danh_gia_khach_san DROP INDEX uq_danh_gia_khach_san_booking;
ALTER TABLE danh_gia_khach_san ADD CONSTRAINT uq_danh_gia_khach_san_booking_target UNIQUE (booking_id, khach_san_id);

USE attraction_db;
ALTER TABLE danh_gia_dia_diem DROP INDEX uq_danh_gia_dia_diem_booking;
ALTER TABLE danh_gia_dia_diem ADD CONSTRAINT uq_danh_gia_dia_diem_booking_target UNIQUE (booking_id, dia_diem_id);

USE flight_db;
ALTER TABLE danh_gia_chuyen_bay DROP INDEX uq_danh_gia_chuyen_bay_booking;
ALTER TABLE danh_gia_chuyen_bay ADD CONSTRAINT uq_danh_gia_chuyen_bay_booking_target UNIQUE (booking_id, flight_id);
