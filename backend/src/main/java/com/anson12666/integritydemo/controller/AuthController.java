package com.anson12666.integritydemo.controller;

import com.anson12666.integritydemo.dto.LoginRequest;
import com.anson12666.integritydemo.dto.LoginResponse;
import com.anson12666.integritydemo.integrity.RequireIntegrity;
import com.anson12666.integritydemo.model.IntegrityAction;
import com.anson12666.integritydemo.service.auth.AuthService;
import com.anson12666.integritydemo.service.support.LogSanitizer;
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

    private final AuthService authService;
    private final LogSanitizer logSanitizer;

    public AuthController(
            AuthService authService,
            LogSanitizer logSanitizer
    ) {
        this.authService = authService;
        this.logSanitizer = logSanitizer;
    }

    @PostMapping("/login")
    @RequireIntegrity(IntegrityAction.login)
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        log.info(
                "HTTP POST /auth/login username={} platform={} challengeId={} proofPreview={}",
                request.username(),
                request.integrity().platform(),
                request.integrity().challengeId(),
                logSanitizer.proofPreview(request.integrity().proof())
        );

        var user = authService.validateCredentials(request.username(), request.password());
        String token = authService.issueToken(user);
        log.info("Login succeeded userId={} tokenPreview={}", user.userId(), logSanitizer.tokenPreview(token));
        return new LoginResponse(token, "Bearer", user.userId());
    }
}
