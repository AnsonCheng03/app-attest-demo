package com.anson12666.integritydemo.controller;

import com.anson12666.integritydemo.dto.CollectVoucherRequest;
import com.anson12666.integritydemo.dto.CollectVoucherResponse;
import com.anson12666.integritydemo.dto.ProfileResponse;
import com.anson12666.integritydemo.integrity.RequireIntegrity;
import com.anson12666.integritydemo.model.AuthenticatedUser;
import com.anson12666.integritydemo.model.IntegrityAction;
import com.anson12666.integritydemo.service.AuthTokenResolver;
import com.anson12666.integritydemo.service.LogSanitizer;
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
    private final LogSanitizer logSanitizer;

    public MeController(
            AuthTokenResolver authTokenResolver,
            LogSanitizer logSanitizer
    ) {
        this.authTokenResolver = authTokenResolver;
        this.logSanitizer = logSanitizer;
    }

    @PostMapping("/vouchers/{voucherId}/collect")
    @RequireIntegrity(value = IntegrityAction.collectVoucher, authenticated = true)
    public CollectVoucherResponse collectVoucher(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String voucherId,
            @Valid @RequestBody CollectVoucherRequest request
    ) {
        log.info(
                "HTTP POST /me/vouchers/{}/collect authorization={} platform={} challengeId={} proofPreview={}",
                voucherId,
                logSanitizer.bearerPreview(authorization),
                request.integrity().platform(),
                request.integrity().challengeId(),
                logSanitizer.proofPreview(request.integrity().proof())
        );
        AuthenticatedUser user = authTokenResolver.requireBearer(authorization);
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
