package com.anson12666.integritydemo.dto;

public record UserDataResponse(
        String userId,
        String username,
        String notes
) {
}
