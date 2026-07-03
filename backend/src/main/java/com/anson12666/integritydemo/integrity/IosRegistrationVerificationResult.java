package com.anson12666.integritydemo.integrity;

public record IosRegistrationVerificationResult(
        String deviceId,
        String publicKey,
        long signCount
) {
}
