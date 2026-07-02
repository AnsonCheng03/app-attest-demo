package com.example.integritydemo.service;

import org.springframework.stereotype.Component;

@Component
public class LogSanitizer {

    public String preview(String value) {
        if (value == null) {
            return "null";
        }
        if (value.length() <= 12) {
            return value;
        }
        return value.substring(0, 6) + "..." + value.substring(value.length() - 6);
    }

    public String tokenPreview(String value) {
        if (value == null || value.isBlank()) {
            return "missing";
        }
        return preview(value);
    }

    public String bearerPreview(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return "missing";
        }
        if (!authorizationHeader.startsWith("Bearer ")) {
            return "invalid-format";
        }
        return "Bearer " + tokenPreview(authorizationHeader.substring("Bearer ".length()));
    }

    public String proofPreview(String proof) {
        return preview(proof);
    }
}
