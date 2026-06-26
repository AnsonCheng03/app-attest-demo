package com.example.integritydemo.dto;

import java.time.Instant;

public record ChallengeResponse(
        String challengeId,
        String challenge,
        Instant expiresAt
) {
}
