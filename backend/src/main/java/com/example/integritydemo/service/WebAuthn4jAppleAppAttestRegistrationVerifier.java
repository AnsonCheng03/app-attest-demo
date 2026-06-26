package com.example.integritydemo.service;

import com.example.integritydemo.config.AppIntegrityProperties;
import com.example.integritydemo.integrity.AppleAppAttestRegistrationVerifier;
import com.example.integritydemo.integrity.IosRegistrationVerificationResult;
import org.springframework.stereotype.Component;

@Component
public class WebAuthn4jAppleAppAttestRegistrationVerifier implements AppleAppAttestRegistrationVerifier {

    private final AppIntegrityProperties properties;

    public WebAuthn4jAppleAppAttestRegistrationVerifier(AppIntegrityProperties properties) {
        this.properties = properties;
    }

    @Override
    public IosRegistrationVerificationResult verifyRegistration(String challenge, String keyId, String attestationObjectBase64) {
        // TODO: Replace this placeholder with WebAuthn4J App Attest verification.
        // Suggested real steps:
        // 1. Verify attestation object bytes against the original challenge.
        // 2. Verify the Apple certificate chain.
        // 3. Verify teamId + bundleId from the attested app identifier.
        // 4. Extract and persist the public key from the attestation result.
        // iOS is different from Android: the backend stores the public key once at registration time
        // and later verifies assertions with that stored key. The public key must not be trusted if
        // the client simply sends a fresh one on every request.
        throw new IllegalStateException(
                "Real iOS attestation verification is not wired yet for bundle " + properties.getIos().getBundleId()
        );
    }
}
