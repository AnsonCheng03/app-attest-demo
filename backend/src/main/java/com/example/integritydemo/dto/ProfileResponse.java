package com.example.integritydemo.dto;

public record ProfileResponse(
        String userId,
        String username,
        String tier
) {
}
