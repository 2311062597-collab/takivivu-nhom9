-- TAKIVIVU - thêm PayPal vào payment_db
USE payment_db;

ALTER TABLE thanh_toan
  MODIFY COLUMN phuong_thuc ENUM('QR_BANK_TRANSFER','PAYPAL') NOT NULL DEFAULT 'QR_BANK_TRANSFER',
  MODIFY COLUMN ma_ngan_hang VARCHAR(50) NULL,
  MODIFY COLUMN so_tai_khoan VARCHAR(50) NULL,
  MODIFY COLUMN noi_dung_chuyen_khoan VARCHAR(100) NULL;

ALTER TABLE thanh_toan
  ADD COLUMN paypal_order_id VARCHAR(50) NULL AFTER transaction_code,
  ADD COLUMN paypal_capture_id VARCHAR(50) NULL AFTER paypal_order_id,
  ADD COLUMN paypal_approval_url TEXT NULL AFTER paypal_capture_id,
  ADD COLUMN paypal_currency VARCHAR(3) NULL AFTER paypal_approval_url,
  ADD COLUMN paypal_amount DECIMAL(15,2) NULL AFTER paypal_currency,
  ADD UNIQUE KEY uk_payment_paypal_order (paypal_order_id),
  ADD KEY idx_payment_method (phuong_thuc);
