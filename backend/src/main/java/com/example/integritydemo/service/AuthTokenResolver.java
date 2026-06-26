package com.example.integritydemo.service;

import com.example.integritydemo.model.AuthenticatedUser;
import org.springframework.stereotype.Component;

@Component
public class AuthTokenResolver {

    private final AuthService authService;

    public AuthTokenResolver(AuthService authService) {
        this.authService = authService;
    }

    public AuthenticatedUser requireBearer(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing bearer token");
        }
        String token = authorizationHeader.substring("Bearer ".length());
        return authService.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid bearer token"));
    }
}
