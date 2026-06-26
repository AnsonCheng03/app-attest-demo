package com.example.integritydemo.dto;

import com.example.integritydemo.model.Platform;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(
        @NotBlank String username,
        @NotBlank String password,
        @Valid @NotNull IntegrityProofDto integrity
) {
    public record IntegrityProofDto(
            @NotNull Platform platform,
            @NotBlank String challengeId,
            @NotBlank String proof
    ) {
    }
}
