package com.example.integritydemo.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.example.integritydemo.service.RequestPayloadHasher;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CollectVoucherRequest(
        @JsonUnwrapped
        @Valid
        @NotNull
        IntegrityProofDto integrity
) implements IntegrityProtectedRequest {

    @Override
    public String requestBodyHash(RequestPayloadHasher requestPayloadHasher) {
        return requestPayloadHasher.emptyBodyHash();
    }
}
