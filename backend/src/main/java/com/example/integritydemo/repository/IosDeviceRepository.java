package com.example.integritydemo.repository;

import com.example.integritydemo.model.IosDeviceRecord;

import java.util.Optional;

public interface IosDeviceRepository {
    void save(IosDeviceRecord record);

    Optional<IosDeviceRecord> findByKeyId(String keyId);

    void update(IosDeviceRecord record);
}
