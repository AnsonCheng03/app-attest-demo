package com.example.integritydemo.controller;

import com.example.integritydemo.dto.CollectVoucherRequest;
import com.example.integritydemo.dto.CollectVoucherResponse;
import com.example.integritydemo.dto.ProfileResponse;
import com.example.integritydemo.model.AuthenticatedUser;
import com.example.integritydemo.model.IntegrityAction;
import com.example.integritydemo.service.AuthTokenResolver;
import com.example.integritydemo.service.IntegrityService;
import com.example.integritydemo.service.LogSanitizer;
import com.example.integritydemo.service.RequestPayloadHasher;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me")
public class MeController {

    private static final Logger log = LoggerFactory.getLogger(MeController.class);

    private final AuthTokenResolver authTokenResolver;
    private final IntegrityService integrityService;
    private final RequestPayloadHasher requestPayloadHasher;
    private final LogSanitizer logSanitizer;

    public MeController(
            AuthTokenResolver authTokenResolver,
            IntegrityService integrityService,
            RequestPayloadHasher requestPayloadHasher,
            LogSanitizer logSanitizer
    ) {
        this.authTokenResolver = authTokenResolver;
        this.integrityService = integrityService;
        this.requestPayloadHasher = requestPayloadHasher;
        this.logSanitizer = logSanitizer;
    }

    @PostMapping("/vouchers/{voucherId}/collect")
    public CollectVoucherResponse collectVoucher(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String voucherId,
            @Valid @RequestBody CollectVoucherRequest request
    ) {
        log.info(
                "HTTP POST /me/vouchers/{}/collect authorization={} platform={} challengeId={} proofPreview={}",
                voucherId,
                logSanitizer.bearerPreview(authorization),
                request.platform(),
                request.challengeId(),
                logSanitizer.proofPreview(request.proof())
        );
        AuthenticatedUser user = authTokenResolver.requireBearer(authorization);
        integrityService.verifyFreshIntegrity(
                user.userId(),
                request.platform(),
                IntegrityAction.collectVoucher,
                request.challengeId(),
                request.proof(),
                requestPayloadHasher.emptyBodyHash(),
                "/me/vouchers/" + voucherId + "/collect",
                "POST"
        );
        log.info("Voucher collected userId={} voucherId={}", user.userId(), voucherId);
        return new CollectVoucherResponse(voucherId, "collected");
    }

    @GetMapping("/profile")
    public ProfileResponse profile(@RequestHeader("Authorization") String authorization) {
        log.info("HTTP GET /me/profile authorization={}", logSanitizer.bearerPreview(authorization));
        AuthenticatedUser user = authTokenResolver.requireBearer(authorization);
        // Low-risk read endpoint: Authorization is still required, but fresh integrity is intentionally
        // not required on every GET so the demo shows integrity can be scoped to higher-risk actions.
        log.info("Profile returned userId={} username={}", user.userId(), user.username());
        return new ProfileResponse(user.userId(), user.username(), "gold");
    }
}
