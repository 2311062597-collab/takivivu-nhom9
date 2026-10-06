CREATE DATABASE IF NOT EXISTS promotion_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE promotion_db;

CREATE TABLE IF NOT EXISTS promotions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  provider_id BIGINT NULL,
  created_by BIGINT NOT NULL,
  provider_name VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  promotion_code VARCHAR(50) NOT NULL,
  description TEXT NULL,
  image_url LONGTEXT NULL,
  discount_type ENUM('PERCENTAGE','FIXED_AMOUNT') NOT NULL,
  discount_value DECIMAL(15,2) NOT NULL,
  min_order_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  max_discount_amount DECIMAL(15,2) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_usage INT NULL,
  max_usage_per_customer INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  status ENUM('ACTIVE','SCHEDULED','INACTIVE','EXPIRED') NOT NULL,
  service_type ENUM('FLIGHT','HOTEL','ATTRACTION') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promotion_code (promotion_code),
  KEY idx_promotion_provider (provider_id),
  KEY idx_promotion_status (status),
  KEY idx_promotion_dates (start_date, end_date),
  CONSTRAINT chk_promotion_discount_value CHECK (discount_value > 0),
  CONSTRAINT chk_promotion_min_order CHECK (min_order_amount >= 0),
  CONSTRAINT chk_promotion_max_discount CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
  CONSTRAINT chk_promotion_usage CHECK (max_usage IS NULL OR max_usage > 0),
  CONSTRAINT chk_promotion_usage_customer CHECK (max_usage_per_customer IS NULL OR max_usage_per_customer > 0),
  CONSTRAINT chk_promotion_dates CHECK (end_date > start_date),
  CONSTRAINT chk_percentage_value CHECK (discount_type <> 'PERCENTAGE' OR discount_value <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promotion_services (
  id BIGINT NOT NULL AUTO_INCREMENT,
  promotion_id BIGINT NOT NULL,
  service_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promotion_service (promotion_id, service_id),
  CONSTRAINT fk_promotion_service_promotion
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promotion_usages (
  id BIGINT NOT NULL AUTO_INCREMENT,
  promotion_id BIGINT NOT NULL,
  customer_id BIGINT NOT NULL,
  booking_id BIGINT NOT NULL,
  discount_amount DECIMAL(15,2) NOT NULL,
  status ENUM('RESERVED','CONFIRMED','CANCELLED') NOT NULL,
  reserved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promotion_usage_booking (booking_id),
  KEY idx_promotion_usage_promotion (promotion_id),
  KEY idx_promotion_usage_customer (promotion_id, customer_id),
  KEY idx_promotion_usage_status (status),
  CONSTRAINT fk_promotion_usage_promotion
    FOREIGN KEY (promotion_id) REFERENCES promotions(id),
  CONSTRAINT chk_promotion_usage_discount CHECK (discount_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
