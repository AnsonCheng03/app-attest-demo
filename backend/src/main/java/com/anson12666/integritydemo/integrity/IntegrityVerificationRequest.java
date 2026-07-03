package com.anson12666.integritydemo.integrity;

import com.anson12666.integritydemo.model.ChallengeRecord;
import com.anson12666.integritydemo.model.IntegrityAction;
import com.anson12666.integritydemo.model.Platform;

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
