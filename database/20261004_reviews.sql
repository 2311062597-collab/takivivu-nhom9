-- TAKIVIVU - bổ sung đánh giá, chạy trên đúng từng database
USE hotel_db;
CREATE TABLE IF NOT EXISTS danh_gia_khach_san (
 id BIGINT NOT NULL AUTO_INCREMENT, user_id BIGINT NOT NULL, booking_id BIGINT NOT NULL, khach_san_id BIGINT NOT NULL,
 so_sao TINYINT NOT NULL, noi_dung VARCHAR(2000) NULL, ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(id), UNIQUE KEY uq_danh_gia_khach_san_booking_target(booking_id, khach_san_id), KEY idx_dgks_user(user_id), KEY idx_dgks_hotel(khach_san_id),
 CONSTRAINT fk_dgks_hotel FOREIGN KEY(khach_san_id) REFERENCES khach_san(id) ON DELETE CASCADE,
 CONSTRAINT chk_dgks_star CHECK(so_sao BETWEEN 1 AND 5)
);

USE attraction_db;
CREATE TABLE IF NOT EXISTS danh_gia_dia_diem (
 id BIGINT NOT NULL AUTO_INCREMENT, user_id BIGINT NOT NULL, booking_id BIGINT NOT NULL, dia_diem_id BIGINT NOT NULL,
 so_sao TINYINT NOT NULL, noi_dung VARCHAR(2000) NULL, ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(id), UNIQUE KEY uq_danh_gia_dia_diem_booking_target(booking_id, dia_diem_id), KEY idx_dgdd_user(user_id), KEY idx_dgdd_target(dia_diem_id),
 CONSTRAINT fk_dgdd_target FOREIGN KEY(dia_diem_id) REFERENCES dia_diem_tham_quan(id) ON DELETE CASCADE,
 CONSTRAINT chk_dgdd_star CHECK(so_sao BETWEEN 1 AND 5)
);

USE flight_db;
CREATE TABLE IF NOT EXISTS danh_gia_chuyen_bay (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    booking_id BIGINT NOT NULL,
    flight_id BIGINT NOT NULL,
    so_sao INT NOT NULL,
    noi_dung TEXT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_danh_gia_chuyen_bay_booking_target UNIQUE (booking_id, flight_id),
    CONSTRAINT chk_danh_gia_chuyen_bay_sao CHECK (so_sao BETWEEN 1 AND 5),
    INDEX idx_dgcb_user (user_id),
    INDEX idx_dgcb_flight (flight_id)
);
