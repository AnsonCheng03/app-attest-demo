package com.example.integritydemo.integrity;

public interface AppIntegrityVerifier {
    IntegrityVerificationResult verify(IntegrityVerificationRequest request);
}
