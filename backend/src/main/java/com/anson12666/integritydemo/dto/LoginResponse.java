package com.anson12666.integritydemo.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        String userId
) {
}
