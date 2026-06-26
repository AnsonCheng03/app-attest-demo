package com.example.integritydemo.service;

import com.example.integritydemo.config.AppIntegrityProperties;
import com.example.integritydemo.integrity.AppIntegrityVerifier;
import com.example.integritydemo.integrity.IntegrityVerificationRequest;
import com.example.integritydemo.integrity.IntegrityVerificationResult;
import org.springframework.stereotype.Component;

@Component
public class MockGooglePlayIntegrityVerifier implements AppIntegrityVerifier {

    private final AppIntegrityProperties properties;

    public MockGooglePlayIntegrityVerifier(AppIntegrityProperties properties) {
        this.properties = properties;
    }

    @Override
    public IntegrityVerificationResult verify(IntegrityVerificationRequest request) {
        // Android does not send a public key to the backend. The app sends a Play Integrity token,
        // and the backend verifies it with Google in real mode. In mock mode, we simulate a token
        // that is bound to the expected request hash so replay/request swapping is still visible.
        String expectedProof = "mock-play-integrity:" + request.requestHash();
        if (!expectedProof.equals(request.proof())) {
            return IntegrityVerificationResult.failure("Mock Play Integrity token mismatch");
        }
        if (properties.getAndroid().getPackageName() == null || properties.getAndroid().getPackageName().isBlank()) {
            return IntegrityVerificationResult.failure("Android packageName config missing");
        }
        return IntegrityVerificationResult.success("android-device-demo", "Mock Google Play Integrity accepted");
    }
}
