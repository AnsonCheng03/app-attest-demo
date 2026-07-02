package com.example.integritydemo.controller;

import com.example.integritydemo.dto.ChallengeRequest;
import com.example.integritydemo.dto.ChallengeResponse;
import com.example.integritydemo.dto.IosRegisterRequest;
import com.example.integritydemo.model.IosDeviceRecord;
import com.example.integritydemo.service.ChallengeService;
import com.example.integritydemo.service.IosAttestationRegistrationService;
import com.example.integritydemo.service.LogSanitizer;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/integrity")
public class IntegrityController {

    private static final Logger log = LoggerFactory.getLogger(IntegrityController.class);

    private final ChallengeService challengeService;
    private final IosAttestationRegistrationService iosAttestationRegistrationService;
    private final LogSanitizer logSanitizer;

    public IntegrityController(
            ChallengeService challengeService,
            IosAttestationRegistrationService iosAttestationRegistrationService,
            LogSanitizer logSanitizer
    ) {
        this.challengeService = challengeService;
        this.iosAttestationRegistrationService = iosAttestationRegistrationService;
        this.logSanitizer = logSanitizer;
    }

    @PostMapping("/challenge")
    public ChallengeResponse createChallenge(@Valid @RequestBody ChallengeRequest request) {
        log.info("HTTP POST /integrity/challenge platform={} action={}", request.platform(), request.action());
        return challengeService.createChallenge(request.platform(), request.action());
    }

    @PostMapping("/ios/register")
    public Map<String, Object> registerIos(@Valid @RequestBody IosRegisterRequest request) {
        log.info(
                "HTTP POST /integrity/ios/register challengeId={} keyId={} challengePreview={} attestationPreview={}",
                request.challengeId(),
                request.keyId(),
                logSanitizer.preview(request.challenge()),
                logSanitizer.proofPreview(request.attestationObject())
        );
        // Demo-only simplification: registration is stored for the single hardcoded demo user.
        IosDeviceRecord record = iosAttestationRegistrationService.register("user-123", request);
        log.info("iOS registration completed userId={} deviceId={} keyId={}", record.userId(), record.deviceId(), record.keyId());
        return Map.of(
                "userId", record.userId(),
                "deviceId", record.deviceId(),
                "keyId", record.keyId(),
                "createdAt", record.createdAt()
        );
    }
}
