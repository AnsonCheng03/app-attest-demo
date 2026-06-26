package com.example.integritydemo.controller;

import com.example.integritydemo.dto.ChallengeRequest;
import com.example.integritydemo.dto.ChallengeResponse;
import com.example.integritydemo.dto.IosRegisterRequest;
import com.example.integritydemo.model.IosDeviceRecord;
import com.example.integritydemo.service.ChallengeService;
import com.example.integritydemo.service.IosAttestationRegistrationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/integrity")
public class IntegrityController {

    private final ChallengeService challengeService;
    private final IosAttestationRegistrationService iosAttestationRegistrationService;

    public IntegrityController(
            ChallengeService challengeService,
            IosAttestationRegistrationService iosAttestationRegistrationService
    ) {
        this.challengeService = challengeService;
        this.iosAttestationRegistrationService = iosAttestationRegistrationService;
    }

    @PostMapping("/challenge")
    public ChallengeResponse createChallenge(@Valid @RequestBody ChallengeRequest request) {
        return challengeService.createChallenge(request.platform(), request.action());
    }

    @PostMapping("/ios/register")
    public Map<String, Object> registerIos(@Valid @RequestBody IosRegisterRequest request) {
        // Demo-only simplification: registration is stored for the single hardcoded demo user.
        IosDeviceRecord record = iosAttestationRegistrationService.register("user-123", request);
        return Map.of(
                "userId", record.userId(),
                "deviceId", record.deviceId(),
                "keyId", record.keyId(),
                "createdAt", record.createdAt()
        );
    }
}
