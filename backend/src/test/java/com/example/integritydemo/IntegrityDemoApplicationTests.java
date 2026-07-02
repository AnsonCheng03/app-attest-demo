package com.example.integritydemo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.integrity.mode=mock")
@AutoConfigureMockMvc
class IntegrityDemoApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void androidLoginRequiresFreshChallengeAndRejectsReuse() throws Exception {
        JsonNode challenge = createChallenge("android", "login");
        String challengeId = challenge.get("challengeId").asText();
        String challengeValue = challenge.get("challenge").asText();
        String proof = "mock-play-integrity:" + requestHash("POST", "/auth/login", loginBodyHash(), challengeValue);

        String loginBody = """
                {
                  "username": "demo",
                  "password": "password123",
                  "integrity": {
                    "platform": "android",
                    "challengeId": "%s",
                    "proof": "%s"
                  }
                }
                """.formatted(challengeId, proof);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("demo-token-user-123"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Challenge already used"));
    }

    @Test
    void iosRegistrationThenLoginAndVoucherCollectionWorkInMockMode() throws Exception {
        JsonNode registrationChallenge = createChallenge("ios", "login");
        String registrationChallengeId = registrationChallenge.get("challengeId").asText();
        String registrationChallengeValue = registrationChallenge.get("challenge").asText();

        String registerBody = """
                {
                  "challengeId": "%s",
                  "challenge": "%s",
                  "keyId": "mock-ios-key",
                  "attestationObject": "mock-ios-attestation:%s:mock-ios-key"
                }
                """.formatted(registrationChallengeId, registrationChallengeValue, registrationChallengeValue);

        mockMvc.perform(post("/integrity/ios/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.keyId").value("mock-ios-key"));

        JsonNode loginChallenge = createChallenge("ios", "login");
        String loginChallengeId = loginChallenge.get("challengeId").asText();
        String loginChallengeValue = loginChallenge.get("challenge").asText();
        String loginProof = "mock-ios-assertion:mock-ios-key:"
                + requestHash("POST", "/auth/login", loginBodyHash(), loginChallengeValue)
                + "|1";

        String loginBody = """
                {
                  "username": "demo",
                  "password": "password123",
                  "integrity": {
                    "platform": "ios",
                    "challengeId": "%s",
                    "proof": "%s"
                  }
                }
                """.formatted(loginChallengeId, loginProof);

        String loginResponse = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(loginResponse).get("accessToken").asText();
        assertThat(token).isEqualTo("demo-token-user-123");

        JsonNode collectChallenge = createChallenge("ios", "collectVoucher");
        String collectChallengeId = collectChallenge.get("challengeId").asText();
        String collectChallengeValue = collectChallenge.get("challenge").asText();
        String collectProof = "mock-ios-assertion:mock-ios-key:"
                + requestHash("POST", "/me/vouchers/voucher-001/collect", emptyBodyHash(), collectChallengeValue)
                + "|2";

        String collectBody = """
                {
                  "platform": "ios",
                  "challengeId": "%s",
                  "proof": "%s"
                }
                """.formatted(collectChallengeId, collectProof);

        mockMvc.perform(post("/me/vouchers/voucher-001/collect")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(collectBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("collected"));
    }

    @Test
    void profileRequiresAuthorizationButNotFreshIntegrity() throws Exception {
        mockMvc.perform(get("/me/profile")
                        .header("Authorization", "Bearer definitely-invalid"))
                .andExpect(status().isUnauthorized());

        JsonNode challenge = createChallenge("android", "login");
        String challengeId = challenge.get("challengeId").asText();
        String challengeValue = challenge.get("challenge").asText();
        String proof = "mock-play-integrity:" + requestHash("POST", "/auth/login", loginBodyHash(), challengeValue);

        String loginBody = """
                {
                  "username": "demo",
                  "password": "password123",
                  "integrity": {
                    "platform": "android",
                    "challengeId": "%s",
                    "proof": "%s"
                  }
                }
                """.formatted(challengeId, proof);

        String loginResponse = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(loginResponse).get("accessToken").asText();

        mockMvc.perform(get("/me/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("demo"))
                .andExpect(jsonPath("$.tier").value("gold"));
    }

    private JsonNode createChallenge(String platform, String action) throws Exception {
        String body = """
                {
                  "platform": "%s",
                  "action": "%s"
                }
                """.formatted(platform, action);

        String response = mockMvc.perform(post("/integrity/challenge")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response);
    }

    private String requestHash(String method, String path, String bodyHash, String challenge) {
        return sha256Base64(method + "\n" + path + "\n" + bodyHash + "\n" + challenge);
    }

    private String loginBodyHash() {
        return sha256Base64("username=demo\npassword=password123");
    }

    private String emptyBodyHash() {
        return sha256Base64("");
    }

    private String sha256Base64(String value) {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256");
            return java.util.Base64.getEncoder().encodeToString(digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
