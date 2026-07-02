package com.example.integritydemo.service;

import com.example.integritydemo.model.AuthenticatedUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AuthTokenResolver {

    private static final Logger log = LoggerFactory.getLogger(AuthTokenResolver.class);

    private final AuthService authService;
    private final LogSanitizer logSanitizer;

    public AuthTokenResolver(AuthService authService, LogSanitizer logSanitizer) {
        this.authService = authService;
        this.logSanitizer = logSanitizer;
    }

    public AuthenticatedUser requireBearer(String authorizationHeader) {
        log.info("requireBearer authorization={}", logSanitizer.bearerPreview(authorizationHeader));
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing bearer token");
        }
        String token = authorizationHeader.substring("Bearer ".length());
        AuthenticatedUser user = authService.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid bearer token"));
        log.info("Bearer resolved userId={} username={}", user.userId(), user.username());
        return user;
    }
}
