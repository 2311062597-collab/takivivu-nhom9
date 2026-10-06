USE payment_db;
ALTER TABLE thanh_toan MODIFY COLUMN phuong_thuc ENUM('PAYPAL','QR_BANK_TRANSFER','PAYOS') NOT NULL;
ALTER TABLE thanh_toan ADD COLUMN payos_payment_link_id VARCHAR(100) NULL;
ALTER TABLE thanh_toan ADD COLUMN payos_checkout_url TEXT NULL;
