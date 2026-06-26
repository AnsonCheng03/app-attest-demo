package com.example.integritydemo.integrity;

public record IosRegistrationVerificationResult(
        String deviceId,
        String publicKey,
        long signCount
) {
}
