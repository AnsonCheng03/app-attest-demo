package com.example.integritydemo.integrity;

public record IntegrityVerificationResult(
        boolean valid,
        String deviceId,
        String detail
) {

    public static IntegrityVerificationResult success(String deviceId, String detail) {
        return new IntegrityVerificationResult(true, deviceId, detail);
    }

    public static IntegrityVerificationResult failure(String detail) {
        return new IntegrityVerificationResult(false, null, detail);
    }
}
