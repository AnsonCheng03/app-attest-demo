package com.anson12666.integritydemo.dto;

import com.anson12666.integritydemo.model.Platform;
import com.anson12666.integritydemo.service.support.RequestPayloadHasher;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveNotesRequest(
        @NotBlank String notes,
        @NotNull Platform platform,
        @NotBlank String challengeId,
        @NotBlank String proof
) implements IntegrityProtectedRequest {

    @Override
    public IntegrityProofDto integrity() {
        return new IntegrityProofDto(platform, challengeId, proof);
    }

    @Override
    public String requestBodyHash(RequestPayloadHasher requestPayloadHasher) {
        return requestPayloadHasher.notesBodyHash(notes);
    }
}
