package com.example.integritydemo.service;

import com.example.integritydemo.model.AuthenticatedUser;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final String DEMO_USERNAME = "demo";
    private static final String DEMO_PASSWORD = "password123";
    private static final AuthenticatedUser DEMO_USER = new AuthenticatedUser("user-123", DEMO_USERNAME);

    private final Map<String, AuthenticatedUser> activeTokens = new ConcurrentHashMap<>();

    public AuthenticatedUser validateCredentials(String username, String password) {
        if (DEMO_USERNAME.equals(username) && DEMO_PASSWORD.equals(password)) {
            return DEMO_USER;
        }
        throw new IllegalArgumentException("Invalid username or password");
    }

    public String issueToken(AuthenticatedUser user) {
        String token = "demo-token-" + user.userId();
        activeTokens.put(token, user);
        return token;
    }

    public Optional<AuthenticatedUser> findByToken(String token) {
        return Optional.ofNullable(activeTokens.get(token));
    }
}
