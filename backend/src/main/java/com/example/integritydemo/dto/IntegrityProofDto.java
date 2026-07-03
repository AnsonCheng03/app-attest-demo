package com.example.integritydemo.dto;

import com.example.integritydemo.model.Platform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IntegrityProofDto(
        @NotNull Platform platform,
        @NotBlank String challengeId,
        @NotBlank String proof
) {
}
