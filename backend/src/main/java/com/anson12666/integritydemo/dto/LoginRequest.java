package com.anson12666.integritydemo.dto;

import com.anson12666.integritydemo.service.support.RequestPayloadHasher;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(
        @NotBlank String username,
        @NotBlank String password,
        @Valid @NotNull IntegrityProofDto integrity
) implements IntegrityProtectedRequest {

    @Override
    public String requestBodyHash(RequestPayloadHasher requestPayloadHasher) {
        return requestPayloadHasher.loginBodyHash(username, password);
    }
}
