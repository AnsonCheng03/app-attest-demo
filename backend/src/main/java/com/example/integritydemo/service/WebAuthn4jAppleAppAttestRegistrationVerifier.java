package com.example.integritydemo.service;

import com.example.integritydemo.config.AppIntegrityProperties;
import com.example.integritydemo.integrity.AppleAppAttestRegistrationVerifier;
import com.example.integritydemo.integrity.IosRegistrationVerificationResult;
import com.webauthn4j.appattest.DeviceCheckManager;
import com.webauthn4j.appattest.data.DCAttestationParameters;
import com.webauthn4j.appattest.data.DCAttestationRequest;
import com.webauthn4j.appattest.server.DCServerProperty;
import com.webauthn4j.converter.AttestedCredentialDataConverter;
import com.webauthn4j.converter.util.ObjectConverter;
import com.webauthn4j.data.client.challenge.DefaultChallenge;
import com.webauthn4j.verifier.exception.VerificationException;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Component
public class WebAuthn4jAppleAppAttestRegistrationVerifier implements AppleAppAttestRegistrationVerifier {

    private final AppIntegrityProperties properties;
    private final AttestedCredentialDataConverter attestedCredentialDataConverter =
            new AttestedCredentialDataConverter(new ObjectConverter());

    public WebAuthn4jAppleAppAttestRegistrationVerifier(AppIntegrityProperties properties) {
        this.properties = properties;
    }

    @Override
    public IosRegistrationVerificationResult verifyRegistration(String challenge, String keyId, String attestationObjectBase64) {
        byte[] challengeBytes = challenge.getBytes(StandardCharsets.UTF_8);
        byte[] keyIdBytes = decodeBase64(keyId, "keyId");
        byte[] attestationObjectBytes = decodeBase64(attestationObjectBase64, "attestationObject");
        byte[] clientDataHash = sha256(challengeBytes);

        DeviceCheckManager deviceCheckManager = DeviceCheckManager.createNonStrictDeviceCheckManager();
        deviceCheckManager
                .getAttestationDataValidator()
                .setProduction(isProductionEnvironment());

        DCServerProperty serverProperty = new DCServerProperty(
                properties.getIos().getTeamId(),
                properties.getIos().getBundleId(),
                new DefaultChallenge(challengeBytes)
        );
        DCAttestationParameters attestationParameters = new DCAttestationParameters(serverProperty);
        DCAttestationRequest attestationRequest = new DCAttestationRequest(
                keyIdBytes,
                attestationObjectBytes,
                clientDataHash
        );

        try {
            var attestationData = deviceCheckManager.validate(attestationRequest, attestationParameters);
            var attestedCredentialData = attestationData
                    .getAttestationObject()
                    .getAuthenticatorData()
                    .getAttestedCredentialData();
            byte[] attestedCredentialDataBytes = attestedCredentialDataConverter.convert(attestedCredentialData);

            return new IosRegistrationVerificationResult(
                    "ios-device-" + keyId,
                    Base64.getEncoder().encodeToString(attestedCredentialDataBytes),
                    0L
            );
        } catch (VerificationException exception) {
            throw new IllegalArgumentException("Real iOS attestation verification failed: " + exception.getMessage(), exception);
        }
    }

    private boolean isProductionEnvironment() {
        return !"development".equalsIgnoreCase(properties.getIos().getAppAttestEnvironment());
    }

    private byte[] decodeBase64(String value, String fieldName) {
        try {
            return Base64.getDecoder().decode(value);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid base64 " + fieldName, exception);
        }
    }

    private byte[] sha256(byte[] value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
