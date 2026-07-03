package com.anson12666.integritydemo;

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

    private static final String DEMO_USERNAME = "alice";
    private static final String DEMO_PASSWORD = "super-secret";
    private static final String DEMO_NOTES = "hello from alice";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void androidLoginRequiresFreshChallengeAndRejectsReuse() throws Exception {
        JsonNode challenge = createChallenge("android", "login");
        String challengeId = challenge.get("challengeId").asText();
        String challengeValue = challenge.get("challenge").asText();
        String proof = "mock-play-integrity:" + requestHash("POST", "/auth/login", loginBodyHash(DEMO_USERNAME, DEMO_PASSWORD), challengeValue);

        String loginBody = """
                {
                  "username": "%s",
                  "password": "%s",
                  "integrity": {
                    "platform": "android",
                    "challengeId": "%s",
                    "proof": "%s"
                  }
                }
                """.formatted(DEMO_USERNAME, DEMO_PASSWORD, challengeId, proof);

        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(objectMapper.readTree(response).get("accessToken").asText()).isNotBlank();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Challenge already used"));
    }

    @Test
    void iosRegistrationThenLoginAndSaveNotesWorkInMockMode() throws Exception {
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
                + requestHash("POST", "/auth/login", loginBodyHash(DEMO_USERNAME, DEMO_PASSWORD), loginChallengeValue)
                + "|1";

        String loginBody = """
                {
                  "username": "%s",
                  "password": "%s",
                  "integrity": {
                    "platform": "ios",
                    "challengeId": "%s",
                    "proof": "%s"
                  }
                }
                """.formatted(DEMO_USERNAME, DEMO_PASSWORD, loginChallengeId, loginProof);

        String loginResponse = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(loginResponse).get("accessToken").asText();
        assertThat(token).isNotBlank();

        JsonNode saveNotesChallenge = createChallenge("ios", "saveNotes");
        String saveNotesChallengeId = saveNotesChallenge.get("challengeId").asText();
        String saveNotesChallengeValue = saveNotesChallenge.get("challenge").asText();
        String collectProof = "mock-ios-assertion:mock-ios-key:"
                + requestHash("POST", "/me/data/save-notes", notesBodyHash(DEMO_NOTES), saveNotesChallengeValue)
                + "|2";

        String saveNotesBody = """
                {
                  "notes": "%s",
                  "platform": "ios",
                  "challengeId": "%s",
                  "proof": "%s"
                }
                """.formatted(DEMO_NOTES, saveNotesChallengeId, collectProof);

        mockMvc.perform(post("/me/data/save-notes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(saveNotesBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("saved"))
                .andExpect(jsonPath("$.notes").value(DEMO_NOTES));
    }

    @Test
    void getDataRequiresAuthorizationButNotFreshIntegrity() throws Exception {
        mockMvc.perform(get("/me/data")
                        .header("Authorization", "Bearer definitely-invalid"))
                .andExpect(status().isUnauthorized());

        JsonNode challenge = createChallenge("android", "login");
        String challengeId = challenge.get("challengeId").asText();
        String challengeValue = challenge.get("challenge").asText();
        String proof = "mock-play-integrity:" + requestHash("POST", "/auth/login", loginBodyHash(DEMO_USERNAME, DEMO_PASSWORD), challengeValue);

        String loginBody = """
                {
                  "username": "%s",
                  "password": "%s",
                  "integrity": {
                    "platform": "android",
                    "challengeId": "%s",
                    "proof": "%s"
                  }
                }
                """.formatted(DEMO_USERNAME, DEMO_PASSWORD, challengeId, proof);

        String loginResponse = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(loginResponse).get("accessToken").asText();

        mockMvc.perform(get("/me/data")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(DEMO_USERNAME))
                .andExpect(jsonPath("$.notes").value(""));
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

    private String loginBodyHash(String username, String password) {
        return sha256Base64("username=" + username + "\npassword=" + password);
    }

    private String notesBodyHash(String notes) {
        return sha256Base64("notes=" + notes);
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
