package com.anson12666.integritydemo.repository;

import com.anson12666.integritydemo.model.IosDeviceRecord;

import java.util.Optional;

public interface IosDeviceRepository {
    void save(IosDeviceRecord record);

    Optional<IosDeviceRecord> findByKeyId(String keyId);

    void update(IosDeviceRecord record);
}
