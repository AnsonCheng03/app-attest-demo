package com.example.integritydemo.model;

import java.time.Instant;

public record ChallengeRecord(
        String challengeId,
        String challenge,
        Platform platform,
        IntegrityAction action,
        Instant expiresAt,
        boolean used
) {

    public ChallengeRecord markUsed() {
        return new ChallengeRecord(challengeId, challenge, platform, action, expiresAt, true);
    }
}
