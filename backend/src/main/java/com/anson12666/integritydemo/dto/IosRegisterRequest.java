package com.anson12666.integritydemo.dto;

import jakarta.validation.constraints.NotBlank;

public record IosRegisterRequest(
        @NotBlank String challengeId,
        @NotBlank String challenge,
        @NotBlank String keyId,
        @NotBlank String attestationObject
) {
}
