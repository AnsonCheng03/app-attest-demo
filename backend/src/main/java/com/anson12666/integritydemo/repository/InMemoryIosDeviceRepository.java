package com.anson12666.integritydemo.repository;

import com.anson12666.integritydemo.model.IosDeviceRecord;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryIosDeviceRepository implements IosDeviceRepository {

    private final Map<String, IosDeviceRecord> storage = new ConcurrentHashMap<>();

    @Override
    public void save(IosDeviceRecord record) {
        storage.put(record.keyId(), record);
    }

    @Override
    public Optional<IosDeviceRecord> findByKeyId(String keyId) {
        return Optional.ofNullable(storage.get(keyId));
    }

    @Override
    public void update(IosDeviceRecord record) {
        storage.put(record.keyId(), record);
    }
}
