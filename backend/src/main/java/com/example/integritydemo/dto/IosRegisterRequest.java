package com.example.integritydemo.dto;

import jakarta.validation.constraints.NotBlank;

public record IosRegisterRequest(
        @NotBlank String challengeId,
        @NotBlank String challenge,
        @NotBlank String keyId,
        @NotBlank String attestationObject
) {
}
