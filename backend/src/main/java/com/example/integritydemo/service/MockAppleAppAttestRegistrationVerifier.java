package com.example.integritydemo.service;

import com.example.integritydemo.integrity.AppleAppAttestRegistrationVerifier;
import com.example.integritydemo.integrity.IosRegistrationVerificationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class MockAppleAppAttestRegistrationVerifier implements AppleAppAttestRegistrationVerifier {

    private static final Logger log = LoggerFactory.getLogger(MockAppleAppAttestRegistrationVerifier.class);

    @Override
    public IosRegistrationVerificationResult verifyRegistration(String challenge, String keyId, String attestationObjectBase64) {
        String expected = "mock-ios-attestation:" + challenge + ":" + keyId;
        log.info("Mock iOS registration verify keyId={} expectedPreview={} actualPreview={}", keyId, expected.substring(0, Math.min(16, expected.length())), attestationObjectBase64.substring(0, Math.min(16, attestationObjectBase64.length())));
        if (!expected.equals(attestationObjectBase64)) {
            throw new IllegalArgumentException("Mock iOS attestation object mismatch");
        }
        log.info("Mock iOS registration accepted keyId={}", keyId);
        return new IosRegistrationVerificationResult("ios-device-" + keyId, "mock-public-key-" + keyId, 0L);
    }
}
