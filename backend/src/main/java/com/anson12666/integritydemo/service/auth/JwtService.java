package com.anson12666.integritydemo.service.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.anson12666.integritydemo.config.AppAuthProperties;
import com.anson12666.integritydemo.model.AuthenticatedUser;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
public class JwtService {

    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private final AppAuthProperties properties;
    private final ObjectMapper objectMapper;

    public JwtService(AppAuthProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public String issueToken(AuthenticatedUser user) {
        long issuedAt = Instant.now().getEpochSecond();
        long expiresAt = issuedAt + properties.getTokenTtlSeconds();
        String headerJson = """
                {"alg":"HS256","typ":"JWT"}
                """.trim();
        String payloadJson = """
                {"sub":"%s","userId":"%s","username":"%s","iat":%d,"exp":%d}
                """.formatted(
                escapeJson(user.userId()),
                escapeJson(user.userId()),
                escapeJson(user.username()),
                issuedAt,
                expiresAt
        );

        String header = encodeUrl(headerJson.getBytes(StandardCharsets.UTF_8));
        String payload = encodeUrl(payloadJson.getBytes(StandardCharsets.UTF_8));
        String signingInput = header + "." + payload;
        return signingInput + "." + sign(signingInput);
    }

    public Optional<AuthenticatedUser> parseToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Optional.empty();
            }
            String signingInput = parts[0] + "." + parts[1];
            if (!MessageDigest.isEqual(parts[2].getBytes(StandardCharsets.UTF_8), sign(signingInput).getBytes(StandardCharsets.UTF_8))) {
                return Optional.empty();
            }
            JsonNode payload = objectMapper.readTree(URL_DECODER.decode(parts[1]));
            long expiresAt = payload.path("exp").asLong(0);
            if (expiresAt <= Instant.now().getEpochSecond()) {
                return Optional.empty();
            }
            String userId = payload.path("userId").asText(null);
            String username = payload.path("username").asText(null);
            if (userId == null || username == null) {
                return Optional.empty();
            }
            return Optional.of(new AuthenticatedUser(userId, username));
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.getJwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return encodeUrl(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to sign JWT", exception);
        }
    }

    private String encodeUrl(byte[] value) {
        return URL_ENCODER.encodeToString(value);
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
