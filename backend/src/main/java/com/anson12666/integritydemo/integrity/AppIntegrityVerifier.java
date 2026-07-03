package com.anson12666.integritydemo.integrity;

public interface AppIntegrityVerifier {
    IntegrityVerificationResult verify(IntegrityVerificationRequest request);
}
