package com.example.integritydemo.service;

import com.example.integritydemo.config.AppIntegrityProperties;
import com.example.integritydemo.integrity.AppIntegrityVerifier;
import com.example.integritydemo.integrity.IntegrityVerificationRequest;
import com.example.integritydemo.integrity.IntegrityVerificationResult;
import org.springframework.stereotype.Component;

@Component
public class RealAppleAppAttestVerifier implements AppIntegrityVerifier {

    private final AppIntegrityProperties properties;

    public RealAppleAppAttestVerifier(AppIntegrityProperties properties) {
        this.properties = properties;
    }

    @Override
    public IntegrityVerificationResult verify(IntegrityVerificationRequest request) {
        // TODO: Replace this placeholder with real App Attest assertion verification.
        // Suggested real steps:
        // 1. Look up the stored public key by keyId from the request proof.
        // 2. Verify the assertion signature with that stored public key.
        // 3. Verify signCount increased compared with the stored record.
        // 4. Verify challenge/requestHash binding so assertions cannot be replayed.
        // 5. Verify teamId + bundleId match expected app identity.
        return IntegrityVerificationResult.failure(
                "Real App Attest assertion verification is not wired yet for team " + properties.getIos().getTeamId()
        );
    }
}
