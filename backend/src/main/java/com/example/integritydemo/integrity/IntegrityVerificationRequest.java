package com.example.integritydemo.integrity;

import com.example.integritydemo.model.ChallengeRecord;
import com.example.integritydemo.model.IntegrityAction;
import com.example.integritydemo.model.Platform;

public record IntegrityVerificationRequest(
        String userId,
        Platform platform,
        IntegrityAction action,
        String proof,
        String requestHash,
        String bodyHash,
        String path,
        String method,
        ChallengeRecord challenge
) {
}
