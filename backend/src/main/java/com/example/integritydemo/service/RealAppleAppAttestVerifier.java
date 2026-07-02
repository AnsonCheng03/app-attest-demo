package com.example.integritydemo.service;

import com.example.integritydemo.config.AppIntegrityProperties;
import com.example.integritydemo.integrity.AppIntegrityVerifier;
import com.example.integritydemo.integrity.IntegrityVerificationRequest;
import com.example.integritydemo.integrity.IntegrityVerificationResult;
import com.example.integritydemo.model.IosDeviceRecord;
import com.example.integritydemo.repository.IosDeviceRepository;
import com.webauthn4j.appattest.DeviceCheckAssertionManager;
import com.webauthn4j.appattest.authenticator.DCAppleDevice;
import com.webauthn4j.appattest.authenticator.DCAppleDeviceImpl;
import com.webauthn4j.appattest.data.DCAssertionParameters;
import com.webauthn4j.appattest.data.DCAssertionRequest;
import com.webauthn4j.appattest.server.DCServerProperty;
import com.webauthn4j.converter.AttestedCredentialDataConverter;
import com.webauthn4j.converter.util.ObjectConverter;
import com.webauthn4j.data.attestation.authenticator.AAGUID;
import com.webauthn4j.data.attestation.authenticator.AttestedCredentialData;
import com.webauthn4j.data.attestation.authenticator.COSEKey;
import com.webauthn4j.data.attestation.authenticator.EC2COSEKey;
import com.webauthn4j.data.attestation.authenticator.EdDSACOSEKey;
import com.webauthn4j.data.attestation.authenticator.RSACOSEKey;
import com.webauthn4j.data.client.challenge.DefaultChallenge;
import com.webauthn4j.verifier.exception.VerificationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.interfaces.ECPublicKey;
import java.security.interfaces.EdECPublicKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Component
public class RealAppleAppAttestVerifier implements AppIntegrityVerifier {

    private static final Logger log = LoggerFactory.getLogger(RealAppleAppAttestVerifier.class);

    private final AppIntegrityProperties properties;
    private final IosDeviceRepository iosDeviceRepository;
    private final LogSanitizer logSanitizer;
    private final AttestedCredentialDataConverter attestedCredentialDataConverter =
            new AttestedCredentialDataConverter(new ObjectConverter());

    public RealAppleAppAttestVerifier(
            AppIntegrityProperties properties,
            IosDeviceRepository iosDeviceRepository,
            LogSanitizer logSanitizer
    ) {
        this.properties = properties;
        this.iosDeviceRepository = iosDeviceRepository;
        this.logSanitizer = logSanitizer;
    }

    @Override
    public IntegrityVerificationResult verify(IntegrityVerificationRequest request) {
        String[] parts = request.proof().split(":", 3);
        if (parts.length != 3 || !"ios-app-attest".equals(parts[0])) {
            return IntegrityVerificationResult.failure("Malformed real iOS proof");
        }

        String keyId = parts[1];
        String assertionBase64 = parts[2];
        log.info(
                "RealAppleAppAttestVerifier verify keyId={} assertionPreview={} requestHashPreview={}",
                keyId,
                logSanitizer.preview(assertionBase64),
                logSanitizer.preview(request.requestHash())
        );

        IosDeviceRecord record = iosDeviceRepository.findByKeyId(keyId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown iOS keyId"));
        log.info(
                "Loaded iOS device record userId={} deviceId={} keyId={} signCount={} publicKeyPreview={}",
                record.userId(),
                record.deviceId(),
                record.keyId(),
                record.signCount(),
                logSanitizer.preview(record.publicKey())
        );

        byte[] keyIdBytes = decodeBase64(keyId, "keyId");
        byte[] assertionBytes = decodeBase64(assertionBase64, "assertion");
        byte[] clientDataHash = sha256(request.requestHash().getBytes(StandardCharsets.UTF_8));

        DeviceCheckAssertionManager manager = new DeviceCheckAssertionManager();
        DCAssertionRequest assertionRequest = new DCAssertionRequest(
                keyIdBytes,
                assertionBytes,
                clientDataHash
        );
        DCAssertionParameters assertionParameters = new DCAssertionParameters(
                new DCServerProperty(
                        properties.getIos().getTeamId(),
                        properties.getIos().getBundleId(),
                        new DefaultChallenge(request.challenge().challenge().getBytes(StandardCharsets.UTF_8))
                ),
                toAppleDevice(record, keyIdBytes)
        );

        try {
            var assertionData = manager.validate(assertionRequest, assertionParameters);
            long newSignCount = assertionData.getAuthenticatorData().getSignCount();
            iosDeviceRepository.update(record.withSignCount(newSignCount));
            log.info(
                    "Real iOS assertion accepted keyId={} previousSignCount={} newSignCount={}",
                    keyId,
                    record.signCount(),
                    newSignCount
            );
            return IntegrityVerificationResult.success(record.deviceId(), "Real Apple App Attest assertion accepted");
        } catch (VerificationException exception) {
            log.error(
                    "Real iOS assertion verification failed keyId={} requestHashPreview={} detail={}",
                    keyId,
                    logSanitizer.preview(request.requestHash()),
                    exception.getMessage(),
                    exception
            );
            return IntegrityVerificationResult.failure("Real Apple App Attest assertion failed: " + exception.getMessage());
        } catch (IllegalArgumentException exception) {
            log.error(
                    "Real iOS assertion rejected keyId={} detail={}",
                    keyId,
                    exception.getMessage(),
                    exception
            );
            throw exception;
        }
    }

    private DCAppleDevice toAppleDevice(IosDeviceRecord record, byte[] keyIdBytes) {
        AttestedCredentialData attestedCredentialData = parseAttestedCredentialData(record, keyIdBytes);
        return new DCAppleDeviceImpl(attestedCredentialData, null, record.signCount(), null);
    }

    private AttestedCredentialData parseAttestedCredentialData(IosDeviceRecord record, byte[] keyIdBytes) {
        byte[] storedBytes = decodeBase64(record.publicKey(), "storedCredential");
        try {
            return attestedCredentialDataConverter.convert(storedBytes);
        } catch (RuntimeException ignored) {
            PublicKey publicKey = parsePublicKey(record.publicKey());
            COSEKey coseKey = toCoseKey(publicKey);
            return new AttestedCredentialData(
                    AAGUID.ZERO,
                    keyIdBytes,
                    coseKey
            );
        }
    }

    private COSEKey toCoseKey(PublicKey publicKey) {
        if (publicKey instanceof ECPublicKey ecPublicKey) {
            return EC2COSEKey.create(ecPublicKey);
        }
        if (publicKey instanceof RSAPublicKey rsaPublicKey) {
            return RSACOSEKey.create(rsaPublicKey);
        }
        if (publicKey instanceof EdECPublicKey edEcPublicKey) {
            return EdDSACOSEKey.create(edEcPublicKey);
        }
        throw new IllegalArgumentException("Unsupported iOS public key algorithm: " + publicKey.getAlgorithm());
    }

    private PublicKey parsePublicKey(String publicKeyBase64) {
        byte[] keyBytes = decodeBase64(publicKeyBase64, "publicKey");
        for (String algorithm : new String[]{"EC", "RSA", "Ed25519", "EdDSA"}) {
            try {
                return KeyFactory.getInstance(algorithm).generatePublic(new X509EncodedKeySpec(keyBytes));
            } catch (Exception ignored) {
                // Try the next algorithm; App Attest should normally be EC.
            }
        }
        throw new IllegalArgumentException("Unable to parse iOS public key");
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
