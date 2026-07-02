package com.example.integritydemo.service;

import com.example.integritydemo.dto.ChallengeResponse;
import com.example.integritydemo.model.ChallengeRecord;
import com.example.integritydemo.model.IntegrityAction;
import com.example.integritydemo.model.Platform;
import com.example.integritydemo.repository.ChallengeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
public class ChallengeService {

    private static final int CHALLENGE_BYTES = 32;
    private static final Logger log = LoggerFactory.getLogger(ChallengeService.class);

    private final SecureRandom secureRandom = new SecureRandom();
    private final ChallengeRepository challengeRepository;

    public ChallengeService(ChallengeRepository challengeRepository) {
        this.challengeRepository = challengeRepository;
    }

    public ChallengeResponse createChallenge(Platform platform, IntegrityAction action) {
        log.info("Creating challenge platform={} action={}", platform, action);
        byte[] random = new byte[CHALLENGE_BYTES];
        secureRandom.nextBytes(random);

        Instant expiresAt = Instant.now().plus(2, ChronoUnit.MINUTES);
        ChallengeRecord record = new ChallengeRecord(
                UUID.randomUUID().toString(),
                Base64.getUrlEncoder().withoutPadding().encodeToString(random),
                platform,
                action,
                expiresAt,
                false
        );
        challengeRepository.save(record);
        log.info("Challenge created challengeId={} expiresAt={} challengePreview={}", record.challengeId(), record.expiresAt(), record.challenge().substring(0, Math.min(12, record.challenge().length())));
        return new ChallengeResponse(record.challengeId(), record.challenge(), record.expiresAt());
    }
}
