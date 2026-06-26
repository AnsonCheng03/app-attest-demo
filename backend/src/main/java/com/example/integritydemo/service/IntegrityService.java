package com.example.integritydemo.service;

import com.example.integritydemo.integrity.AppIntegrityVerifier;
import com.example.integritydemo.integrity.IntegrityVerificationRequest;
import com.example.integritydemo.integrity.IntegrityVerificationResult;
import com.example.integritydemo.model.ChallengeRecord;
import com.example.integritydemo.model.IntegrityAction;
import com.example.integritydemo.model.Platform;
import com.example.integritydemo.repository.ChallengeRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.EnumMap;
import java.util.Map;

@Service
public class IntegrityService {

    private final ChallengeRepository challengeRepository;
    private final HashingService hashingService;
    private final Map<Platform, AppIntegrityVerifier> verifiers;

    public IntegrityService(
            ChallengeRepository challengeRepository,
            HashingService hashingService,
            GooglePlayIntegrityVerifier googlePlayIntegrityVerifier,
            AppleAppAttestVerifier appleAppAttestVerifier
    ) {
        this.challengeRepository = challengeRepository;
        this.hashingService = hashingService;
        this.verifiers = new EnumMap<>(Platform.class);
        this.verifiers.put(Platform.android, googlePlayIntegrityVerifier);
        this.verifiers.put(Platform.ios, appleAppAttestVerifier);
    }

    public IntegrityVerificationResult verifyFreshIntegrity(
            String userId,
            Platform platform,
            IntegrityAction action,
            String challengeId,
            String proof,
            String requestBodyHash,
            String path,
            String method
    ) {
        ChallengeRecord challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found"));

        if (challenge.expiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Challenge expired");
        }
        if (challenge.used()) {
            throw new IllegalArgumentException("Challenge already used");
        }
        if (challenge.platform() != platform) {
            throw new IllegalArgumentException("Challenge platform mismatch");
        }
        if (challenge.action() != action) {
            throw new IllegalArgumentException("Challenge action mismatch");
        }

        String expectedRequestHash = hashingService.sha256Base64(
                method + "\n" + path + "\n" + requestBodyHash + "\n" + challenge.challenge()
        );

        IntegrityVerificationResult result = verifierFor(platform).verify(new IntegrityVerificationRequest(
                userId,
                platform,
                action,
                proof,
                expectedRequestHash,
                requestBodyHash,
                path,
                method,
                challenge
        ));

        if (!result.valid()) {
            throw new IllegalArgumentException("Integrity verification failed: " + result.detail());
        }

        challengeRepository.markUsed(challengeId);
        return result;
    }

    public void consumeIosRegistrationChallenge(String challengeId, String challengeValue) {
        ChallengeRecord challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found"));
        if (challenge.expiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Challenge expired");
        }
        if (challenge.used()) {
            throw new IllegalArgumentException("Challenge already used");
        }
        if (challenge.platform() != Platform.ios) {
            throw new IllegalArgumentException("Challenge platform mismatch");
        }
        if (challenge.action() != IntegrityAction.login) {
            throw new IllegalArgumentException("iOS registration expects a login-bound challenge");
        }
        if (!challenge.challenge().equals(challengeValue)) {
            throw new IllegalArgumentException("Challenge value mismatch");
        }
    }

    public void markChallengeUsed(String challengeId) {
        challengeRepository.markUsed(challengeId);
    }

    private AppIntegrityVerifier verifierFor(Platform platform) {
        AppIntegrityVerifier verifier = verifiers.get(platform);
        if (verifier == null) {
            throw new IllegalArgumentException("Unsupported platform: " + platform);
        }
        return verifier;
    }
}
