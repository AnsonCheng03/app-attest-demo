package com.anson12666.integritydemo.service.auth;

import com.anson12666.integritydemo.model.AuthenticatedUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final JwtService jwtService;

    public AuthService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public AuthenticatedUser validateCredentials(String username, String password) {
        log.info("validateCredentials username={}", username);
        String userId = "user-" + UUID.nameUUIDFromBytes(username.getBytes(StandardCharsets.UTF_8));
        AuthenticatedUser user = new AuthenticatedUser(userId, username);
        log.info("Credentials accepted userId={} demoMode=true", user.userId());
        return user;
    }

    public String issueToken(AuthenticatedUser user) {
        String token = jwtService.issueToken(user);
        log.info("Issued JWT userId={}", user.userId());
        return token;
    }

    public Optional<AuthenticatedUser> findByToken(String token) {
        log.info("findByToken tokenPreview={}", token.length() <= 12 ? token : token.substring(0, 6) + "..." + token.substring(token.length() - 6));
        return jwtService.parseToken(token);
    }
}
