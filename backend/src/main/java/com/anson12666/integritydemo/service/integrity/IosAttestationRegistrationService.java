package com.anson12666.integritydemo.service.integrity;

import com.anson12666.integritydemo.config.AppIntegrityProperties;
import com.anson12666.integritydemo.dto.IosRegisterRequest;
import com.anson12666.integritydemo.integrity.AppleAppAttestRegistrationVerifier;
import com.anson12666.integritydemo.integrity.IosRegistrationVerificationResult;
import com.anson12666.integritydemo.model.IosDeviceRecord;
import com.anson12666.integritydemo.repository.IosDeviceRepository;
import com.anson12666.integritydemo.service.integrity.apple.MockAppleAppAttestRegistrationVerifier;
import com.anson12666.integritydemo.service.integrity.apple.WebAuthn4jAppleAppAttestRegistrationVerifier;
import com.anson12666.integritydemo.service.support.LogSanitizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class IosAttestationRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(IosAttestationRegistrationService.class);

    private final AppIntegrityProperties properties;
    private final IntegrityService integrityService;
    private final MockAppleAppAttestRegistrationVerifier mockVerifier;
    private final WebAuthn4jAppleAppAttestRegistrationVerifier realVerifier;
    private final IosDeviceRepository iosDeviceRepository;
    private final LogSanitizer logSanitizer;

    public IosAttestationRegistrationService(
            AppIntegrityProperties properties,
            IntegrityService integrityService,
            MockAppleAppAttestRegistrationVerifier mockVerifier,
            WebAuthn4jAppleAppAttestRegistrationVerifier realVerifier,
            IosDeviceRepository iosDeviceRepository,
            LogSanitizer logSanitizer
    ) {
        this.properties = properties;
        this.integrityService = integrityService;
        this.mockVerifier = mockVerifier;
        this.realVerifier = realVerifier;
        this.iosDeviceRepository = iosDeviceRepository;
        this.logSanitizer = logSanitizer;
    }

    public IosDeviceRecord register(String userId, IosRegisterRequest request) {
        log.info(
                "register iOS attestation start userId={} mode={} challengeId={} keyId={} challengePreview={} attestationPreview={}",
                userId,
                properties.getMode(),
                request.challengeId(),
                request.keyId(),
                logSanitizer.preview(request.challenge()),
                logSanitizer.proofPreview(request.attestationObject())
        );
        integrityService.consumeIosRegistrationChallenge(request.challengeId(), request.challenge());
        AppleAppAttestRegistrationVerifier verifier = "mock".equalsIgnoreCase(properties.getMode()) ? mockVerifier : realVerifier;
        log.info("Selected iOS registration verifier={}", verifier.getClass().getSimpleName());
        IosRegistrationVerificationResult result = verifier.verifyRegistration(
                request.challenge(),
                request.keyId(),
                request.attestationObject()
        );
        log.info("iOS registration verifier result deviceId={} publicKeyPreview={} signCount={}", result.deviceId(), logSanitizer.preview(result.publicKey()), result.signCount());
        IosDeviceRecord record = new IosDeviceRecord(
                userId,
                result.deviceId(),
                request.keyId(),
                result.publicKey(),
                result.signCount(),
                Instant.now()
        );
        iosDeviceRepository.save(record);
        integrityService.markChallengeUsed(request.challengeId());
        log.info("iOS device record saved userId={} deviceId={} keyId={} signCount={}", record.userId(), record.deviceId(), record.keyId(), record.signCount());
        return record;
    }
}
