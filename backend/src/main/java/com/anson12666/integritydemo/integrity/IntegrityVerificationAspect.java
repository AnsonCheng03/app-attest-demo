package com.anson12666.integritydemo.integrity;

import com.anson12666.integritydemo.dto.IntegrityProtectedRequest;
import com.anson12666.integritydemo.model.AuthenticatedUser;
import com.anson12666.integritydemo.service.AuthTokenResolver;
import com.anson12666.integritydemo.service.IntegrityService;
import com.anson12666.integritydemo.service.RequestPayloadHasher;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class IntegrityVerificationAspect {

    private static final String DEMO_USER_ID = "user-123";

    private final IntegrityService integrityService;
    private final RequestPayloadHasher requestPayloadHasher;
    private final AuthTokenResolver authTokenResolver;
    private final HttpServletRequest httpServletRequest;

    public IntegrityVerificationAspect(
            IntegrityService integrityService,
            RequestPayloadHasher requestPayloadHasher,
            AuthTokenResolver authTokenResolver,
            HttpServletRequest httpServletRequest
    ) {
        this.integrityService = integrityService;
        this.requestPayloadHasher = requestPayloadHasher;
        this.authTokenResolver = authTokenResolver;
        this.httpServletRequest = httpServletRequest;
    }

    @Around("@annotation(requireIntegrity)")
    public Object verifyIntegrity(ProceedingJoinPoint joinPoint, RequireIntegrity requireIntegrity) throws Throwable {
        IntegrityProtectedRequest request = findIntegrityRequest(joinPoint.getArgs());

        integrityService.verifyFreshIntegrity(
                resolveUserId(requireIntegrity),
                request.integrity().platform(),
                requireIntegrity.value(),
                request.integrity().challengeId(),
                request.integrity().proof(),
                request.requestBodyHash(requestPayloadHasher),
                httpServletRequest.getRequestURI(),
                httpServletRequest.getMethod()
        );

        return joinPoint.proceed();
    }

    private IntegrityProtectedRequest findIntegrityRequest(Object[] args) {
        for (Object arg : args) {
            if (arg instanceof IntegrityProtectedRequest integrityRequest) {
                return integrityRequest;
            }
        }
        throw new IllegalStateException("@RequireIntegrity requires a request implementing IntegrityProtectedRequest");
    }

    private String resolveUserId(RequireIntegrity requireIntegrity) {
        if (!requireIntegrity.authenticated()) {
            return DEMO_USER_ID;
        }
        AuthenticatedUser user = authTokenResolver.requireBearer(httpServletRequest.getHeader("Authorization"));
        return user.userId();
    }
}
