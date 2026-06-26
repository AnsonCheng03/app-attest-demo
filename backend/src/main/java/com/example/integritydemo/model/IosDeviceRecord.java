package com.example.integritydemo.model;

import java.time.Instant;

public record IosDeviceRecord(
        String userId,
        String deviceId,
        String keyId,
        String publicKey,
        long signCount,
        Instant createdAt
) {

    public IosDeviceRecord withSignCount(long newSignCount) {
        return new IosDeviceRecord(userId, deviceId, keyId, publicKey, newSignCount, createdAt);
    }
}
