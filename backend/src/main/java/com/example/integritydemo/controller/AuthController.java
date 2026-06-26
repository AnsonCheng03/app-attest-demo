package com.example.integritydemo.controller;

import com.example.integritydemo.dto.LoginRequest;
import com.example.integritydemo.dto.LoginResponse;
import com.example.integritydemo.model.IntegrityAction;
import com.example.integritydemo.service.AuthService;
import com.example.integritydemo.service.IntegrityService;
import com.example.integritydemo.service.RequestPayloadHasher;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final IntegrityService integrityService;
    private final AuthService authService;
    private final RequestPayloadHasher requestPayloadHasher;

    public AuthController(
            IntegrityService integrityService,
            AuthService authService,
            RequestPayloadHasher requestPayloadHasher
    ) {
        this.integrityService = integrityService;
        this.authService = authService;
        this.requestPayloadHasher = requestPayloadHasher;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        String bodyHash = requestPayloadHasher.loginBodyHash(request.username(), request.password());
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
        return new LoginResponse(token, "Bearer", user.userId());
    }
}
