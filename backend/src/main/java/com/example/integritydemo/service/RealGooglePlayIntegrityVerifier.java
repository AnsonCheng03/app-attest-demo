package com.example.integritydemo.service;

import com.example.integritydemo.config.AppIntegrityProperties;
import com.example.integritydemo.integrity.AppIntegrityVerifier;
import com.example.integritydemo.integrity.IntegrityVerificationRequest;
import com.example.integritydemo.integrity.IntegrityVerificationResult;
import org.springframework.stereotype.Component;

@Component
public class RealGooglePlayIntegrityVerifier implements AppIntegrityVerifier {

    private final AppIntegrityProperties properties;

    public RealGooglePlayIntegrityVerifier(AppIntegrityProperties properties) {
        this.properties = properties;
    }

    @Override
    public IntegrityVerificationResult verify(IntegrityVerificationRequest request) {
        // TODO: Replace this placeholder with real Google Play Integrity verification:
        // 1. Call Google Play Integrity API / decode the returned token.
        // 2. Check packageName == configured expected package name.
        // 3. Check certificate digest == configured expected signing cert digest.
        // 4. Check appRecognitionVerdict == PLAY_RECOGNIZED.
        // 5. Check deviceIntegrity contains MEETS_DEVICE_INTEGRITY.
        // 6. Check requestHash matches request.requestHash().
        // Android verification is Google-backed; the backend should not trust any public key
        // supplied per request because the trust anchor is Google's signed verdict.
        return IntegrityVerificationResult.failure(
                "Real Google Play Integrity verification is not wired yet for package "
                        + properties.getAndroid().getPackageName()
        );
    }
}
