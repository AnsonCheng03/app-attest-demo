package com.example.integritydemo.service;

import com.example.integritydemo.integrity.AppleAppAttestRegistrationVerifier;
import com.example.integritydemo.integrity.IosRegistrationVerificationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class MockAppleAppAttestRegistrationVerifier implements AppleAppAttestRegistrationVerifier {

    private static final Logger log = LoggerFactory.getLogger(MockAppleAppAttestRegistrationVerifier.class);

    private static String preview(String value) {
        if (value == null) {
            return "null";
        }
        if (value.length() <= 48) {
            return value;
        }
        return value.substring(0, 24) + "..." + value.substring(value.length() - 12);
    }

    @Override
    public IosRegistrationVerificationResult verifyRegistration(String challenge, String keyId, String attestationObjectBase64) {
        String expected = "mock-ios-attestation:" + challenge + ":" + keyId;
        String expectedPreview = preview(expected);
        String actualPreview = preview(attestationObjectBase64);
        log.info("Mock iOS registration verify keyId={} expectedPreview={} actualPreview={}", keyId, expectedPreview, actualPreview);
        if (!expected.equals(attestationObjectBase64)) {
            throw new IllegalArgumentException(
                    "Mock iOS attestation object mismatch"
                            + " | keyId=" + keyId
                            + " | expected=" + expectedPreview
                            + " | actual=" + actualPreview
            );
        }
        log.info("Mock iOS registration accepted keyId={}", keyId);
        return new IosRegistrationVerificationResult("ios-device-" + keyId, "mock-public-key-" + keyId, 0L);
    }
}
