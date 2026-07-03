package com.anson12666.integritydemo.integrity;

public interface AppleAppAttestRegistrationVerifier {
    IosRegistrationVerificationResult verifyRegistration(String challenge, String keyId, String attestationObjectBase64);
}
