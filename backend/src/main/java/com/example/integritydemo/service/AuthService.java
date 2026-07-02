package com.example.integritydemo.service;

import com.example.integritydemo.model.AuthenticatedUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final String DEMO_USERNAME = "demo";
    private static final String DEMO_PASSWORD = "password123";
    private static final AuthenticatedUser DEMO_USER = new AuthenticatedUser("user-123", DEMO_USERNAME);
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final Map<String, AuthenticatedUser> activeTokens = new ConcurrentHashMap<>();

    public AuthenticatedUser validateCredentials(String username, String password) {
        log.info("validateCredentials username={}", username);
        if (DEMO_USERNAME.equals(username) && DEMO_PASSWORD.equals(password)) {
            log.info("Credentials accepted userId={}", DEMO_USER.userId());
            return DEMO_USER;
        }
        log.warn("Credentials rejected username={}", username);
        throw new IllegalArgumentException("Invalid username or password");
    }

    public String issueToken(AuthenticatedUser user) {
        String token = "demo-token-" + user.userId();
        activeTokens.put(token, user);
        log.info("Issued token userId={} activeTokenCount={}", user.userId(), activeTokens.size());
        return token;
    }

    public Optional<AuthenticatedUser> findByToken(String token) {
        log.info("findByToken tokenPreview={}", token.length() <= 12 ? token : token.substring(0, 6) + "..." + token.substring(token.length() - 6));
        return Optional.ofNullable(activeTokens.get(token));
    }
}
