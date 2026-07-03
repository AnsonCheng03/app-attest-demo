package com.anson12666.integritydemo.service;

import com.anson12666.integritydemo.config.AppIntegrityProperties;
import com.anson12666.integritydemo.integrity.AppIntegrityVerifier;
import com.anson12666.integritydemo.integrity.IntegrityVerificationRequest;
import com.anson12666.integritydemo.integrity.IntegrityVerificationResult;
import org.springframework.stereotype.Component;

@Component
public class AppleAppAttestVerifier implements AppIntegrityVerifier {

    private final AppIntegrityProperties properties;
    private final MockAppleAppAttestVerifier mockVerifier;
    private final RealAppleAppAttestVerifier realVerifier;

    public AppleAppAttestVerifier(
            AppIntegrityProperties properties,
            MockAppleAppAttestVerifier mockVerifier,
            RealAppleAppAttestVerifier realVerifier
    ) {
        this.properties = properties;
        this.mockVerifier = mockVerifier;
        this.realVerifier = realVerifier;
    }

    @Override
    public IntegrityVerificationResult verify(IntegrityVerificationRequest request) {
        if ("mock".equalsIgnoreCase(properties.getMode())) {
            return mockVerifier.verify(request);
        }
        return realVerifier.verify(request);
    }
}
