package com.example.integritydemo.controller;

import com.example.integritydemo.dto.CollectVoucherRequest;
import com.example.integritydemo.dto.CollectVoucherResponse;
import com.example.integritydemo.dto.ProfileResponse;
import com.example.integritydemo.model.AuthenticatedUser;
import com.example.integritydemo.model.IntegrityAction;
import com.example.integritydemo.service.AuthTokenResolver;
import com.example.integritydemo.service.IntegrityService;
import com.example.integritydemo.service.RequestPayloadHasher;
import jakarta.validation.Valid;
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

    private final AuthTokenResolver authTokenResolver;
    private final IntegrityService integrityService;
    private final RequestPayloadHasher requestPayloadHasher;

    public MeController(
            AuthTokenResolver authTokenResolver,
            IntegrityService integrityService,
            RequestPayloadHasher requestPayloadHasher
    ) {
        this.authTokenResolver = authTokenResolver;
        this.integrityService = integrityService;
        this.requestPayloadHasher = requestPayloadHasher;
    }

    @PostMapping("/vouchers/{voucherId}/collect")
    public CollectVoucherResponse collectVoucher(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String voucherId,
            @Valid @RequestBody CollectVoucherRequest request
    ) {
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
        return new CollectVoucherResponse(voucherId, "collected");
    }

    @GetMapping("/profile")
    public ProfileResponse profile(@RequestHeader("Authorization") String authorization) {
        AuthenticatedUser user = authTokenResolver.requireBearer(authorization);
        // Low-risk read endpoint: Authorization is still required, but fresh integrity is intentionally
        // not required on every GET so the demo shows integrity can be scoped to higher-risk actions.
        return new ProfileResponse(user.userId(), user.username(), "gold");
    }
}
