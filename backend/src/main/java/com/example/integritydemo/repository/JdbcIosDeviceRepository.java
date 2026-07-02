package com.example.integritydemo.repository;

import com.example.integritydemo.model.IosDeviceRecord;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
@Primary
public class JdbcIosDeviceRepository implements IosDeviceRepository {

    private static final RowMapper<IosDeviceRecord> ROW_MAPPER = JdbcIosDeviceRepository::mapRow;

    private final JdbcTemplate jdbcTemplate;

    public JdbcIosDeviceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void save(IosDeviceRecord record) {
        upsert(record);
    }

    @Override
    public Optional<IosDeviceRecord> findByKeyId(String keyId) {
        List<IosDeviceRecord> records = jdbcTemplate.query(
                """
                select user_id, device_id, key_id, public_key, sign_count, created_at
                from ios_device
                where key_id = ?
                """,
                ROW_MAPPER,
                keyId
        );
        return records.stream().findFirst();
    }

    @Override
    public void update(IosDeviceRecord record) {
        upsert(record);
    }

    private void upsert(IosDeviceRecord record) {
        jdbcTemplate.update(
                """
                merge into ios_device (key_id, user_id, device_id, public_key, sign_count, created_at)
                values (?, ?, ?, ?, ?, ?)
                """,
                record.keyId(),
                record.userId(),
                record.deviceId(),
                record.publicKey(),
                record.signCount(),
                Timestamp.from(record.createdAt())
        );
    }

    private static IosDeviceRecord mapRow(ResultSet resultSet, int rowNum) throws SQLException {
        Timestamp createdAt = resultSet.getTimestamp("created_at");
        return new IosDeviceRecord(
                resultSet.getString("user_id"),
                resultSet.getString("device_id"),
                resultSet.getString("key_id"),
                resultSet.getString("public_key"),
                resultSet.getLong("sign_count"),
                createdAt != null ? createdAt.toInstant() : Instant.EPOCH
        );
    }
}
