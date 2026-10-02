package com.example.hotelservice.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class HotelSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public HotelSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        addColumnIfMissing(
                "khach_san",
                "so_dien_thoai",
                "ALTER TABLE khach_san ADD COLUMN so_dien_thoai VARCHAR(20) NULL AFTER thanh_pho"
        );

        addColumnIfMissing(
                "khach_san",
                "email",
                "ALTER TABLE khach_san ADD COLUMN email VARCHAR(254) NULL AFTER so_dien_thoai"
        );

        addColumnIfMissing(
                "khach_san",
                "hinh_anh",
                "ALTER TABLE khach_san ADD COLUMN hinh_anh TEXT NULL AFTER email"
        );
    }

    private void addColumnIfMissing(String tableName, String columnName, String alterSql) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                """,
                Integer.class,
                tableName,
                columnName
        );

        if (count != null && count == 0) {
            jdbcTemplate.execute(alterSql);
        }
    }
}
