package com.example.integritydemo.dto;

import com.example.integritydemo.model.IntegrityAction;
import com.example.integritydemo.model.Platform;
import jakarta.validation.constraints.NotNull;

public record ChallengeRequest(
        @NotNull Platform platform,
        @NotNull IntegrityAction action
) {
}
