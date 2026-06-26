package com.example.integritydemo.service;

import com.example.integritydemo.integrity.AppleAppAttestRegistrationVerifier;
import com.example.integritydemo.integrity.IosRegistrationVerificationResult;
import org.springframework.stereotype.Component;

@Component
public class MockAppleAppAttestRegistrationVerifier implements AppleAppAttestRegistrationVerifier {

    @Override
    public IosRegistrationVerificationResult verifyRegistration(String challenge, String keyId, String attestationObjectBase64) {
        String expected = "mock-ios-attestation:" + challenge + ":" + keyId;
        if (!expected.equals(attestationObjectBase64)) {
            throw new IllegalArgumentException("Mock iOS attestation object mismatch");
        }
        return new IosRegistrationVerificationResult("ios-device-" + keyId, "mock-public-key-" + keyId, 0L);
    }
}
