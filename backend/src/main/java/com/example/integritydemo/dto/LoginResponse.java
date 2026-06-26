package com.example.integritydemo.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        String userId
) {
}
