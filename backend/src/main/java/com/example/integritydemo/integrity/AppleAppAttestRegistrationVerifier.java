package com.example.integritydemo.integrity;

public interface AppleAppAttestRegistrationVerifier {
    IosRegistrationVerificationResult verifyRegistration(String challenge, String keyId, String attestationObjectBase64);
}
