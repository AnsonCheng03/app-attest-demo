package com.example.integritydemo.service;

import com.example.integritydemo.config.AppIntegrityProperties;
import com.example.integritydemo.dto.IosRegisterRequest;
import com.example.integritydemo.integrity.AppleAppAttestRegistrationVerifier;
import com.example.integritydemo.integrity.IosRegistrationVerificationResult;
import com.example.integritydemo.model.IosDeviceRecord;
import com.example.integritydemo.repository.IosDeviceRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class IosAttestationRegistrationService {

    private final AppIntegrityProperties properties;
    private final IntegrityService integrityService;
    private final MockAppleAppAttestRegistrationVerifier mockVerifier;
    private final WebAuthn4jAppleAppAttestRegistrationVerifier realVerifier;
    private final IosDeviceRepository iosDeviceRepository;

    public IosAttestationRegistrationService(
            AppIntegrityProperties properties,
            IntegrityService integrityService,
            MockAppleAppAttestRegistrationVerifier mockVerifier,
            WebAuthn4jAppleAppAttestRegistrationVerifier realVerifier,
            IosDeviceRepository iosDeviceRepository
    ) {
        this.properties = properties;
        this.integrityService = integrityService;
        this.mockVerifier = mockVerifier;
        this.realVerifier = realVerifier;
        this.iosDeviceRepository = iosDeviceRepository;
    }

    public IosDeviceRecord register(String userId, IosRegisterRequest request) {
        integrityService.consumeIosRegistrationChallenge(request.challengeId(), request.challenge());
        AppleAppAttestRegistrationVerifier verifier = "mock".equalsIgnoreCase(properties.getMode()) ? mockVerifier : realVerifier;
        IosRegistrationVerificationResult result = verifier.verifyRegistration(
                request.challenge(),
                request.keyId(),
                request.attestationObject()
        );
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
        return record;
    }
}
