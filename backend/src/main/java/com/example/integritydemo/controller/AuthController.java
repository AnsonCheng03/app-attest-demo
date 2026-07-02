package com.example.integritydemo.controller;

import com.example.integritydemo.dto.LoginRequest;
import com.example.integritydemo.dto.LoginResponse;
import com.example.integritydemo.model.IntegrityAction;
import com.example.integritydemo.service.AuthService;
import com.example.integritydemo.service.IntegrityService;
import com.example.integritydemo.service.LogSanitizer;
import com.example.integritydemo.service.RequestPayloadHasher;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final IntegrityService integrityService;
    private final AuthService authService;
    private final RequestPayloadHasher requestPayloadHasher;
    private final LogSanitizer logSanitizer;

    public AuthController(
            IntegrityService integrityService,
            AuthService authService,
            RequestPayloadHasher requestPayloadHasher,
            LogSanitizer logSanitizer
    ) {
        this.integrityService = integrityService;
        this.authService = authService;
        this.requestPayloadHasher = requestPayloadHasher;
        this.logSanitizer = logSanitizer;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        log.info(
                "HTTP POST /auth/login username={} platform={} challengeId={} proofPreview={}",
                request.username(),
                request.integrity().platform(),
                request.integrity().challengeId(),
                logSanitizer.proofPreview(request.integrity().proof())
        );
        String bodyHash = requestPayloadHasher.loginBodyHash(request.username(), request.password());
        log.info("Computed login bodyHash={}", logSanitizer.preview(bodyHash));
        integrityService.verifyFreshIntegrity(
                "user-123",
                request.integrity().platform(),
                IntegrityAction.login,
                request.integrity().challengeId(),
                request.integrity().proof(),
                bodyHash,
                "/auth/login",
                "POST"
        );

        var user = authService.validateCredentials(request.username(), request.password());
        String token = authService.issueToken(user);
        log.info("Login succeeded userId={} tokenPreview={}", user.userId(), logSanitizer.tokenPreview(token));
        return new LoginResponse(token, "Bearer", user.userId());
    }
}
