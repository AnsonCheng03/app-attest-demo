package com.anson12666.integritydemo.dto;

import com.anson12666.integritydemo.model.IntegrityAction;
import com.anson12666.integritydemo.model.Platform;
import jakarta.validation.constraints.NotNull;

public record ChallengeRequest(
        @NotNull Platform platform,
        @NotNull IntegrityAction action
) {
}
