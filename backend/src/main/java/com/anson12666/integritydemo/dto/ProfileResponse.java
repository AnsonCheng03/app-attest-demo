package com.anson12666.integritydemo.dto;

public record ProfileResponse(
        String userId,
        String username,
        String tier
) {
}
