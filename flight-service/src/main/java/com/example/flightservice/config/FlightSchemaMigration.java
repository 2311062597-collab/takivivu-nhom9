package com.example.flightservice.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class FlightSchemaMigration implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    public FlightSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'flights' AND COLUMN_NAME = 'hang_ve'",
                Integer.class
        );
        if (count != null && count == 0) {
            jdbcTemplate.execute("ALTER TABLE flights ADD COLUMN hang_ve VARCHAR(50) NOT NULL DEFAULT 'Phổ thông' AFTER thoi_gian_den");
        }
        jdbcTemplate.update("UPDATE flights SET hang_ve = 'Phổ thông' WHERE hang_ve IS NULL OR TRIM(hang_ve) = ''");
    }
}
