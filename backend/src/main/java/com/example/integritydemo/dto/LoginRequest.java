package com.example.integritydemo.dto;

import com.example.integritydemo.service.RequestPayloadHasher;
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
