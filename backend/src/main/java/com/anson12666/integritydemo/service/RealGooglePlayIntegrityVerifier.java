package com.anson12666.integritydemo.service;

import com.anson12666.integritydemo.config.AppIntegrityProperties;
import com.anson12666.integritydemo.integrity.AppIntegrityVerifier;
import com.anson12666.integritydemo.integrity.IntegrityVerificationRequest;
import com.anson12666.integritydemo.integrity.IntegrityVerificationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class RealGooglePlayIntegrityVerifier implements AppIntegrityVerifier {

    private static final Logger log = LoggerFactory.getLogger(RealGooglePlayIntegrityVerifier.class);

    private final AppIntegrityProperties properties;
    private final LogSanitizer logSanitizer;

    public RealGooglePlayIntegrityVerifier(AppIntegrityProperties properties, LogSanitizer logSanitizer) {
        this.properties = properties;
        this.logSanitizer = logSanitizer;
    }

    @Override
    public IntegrityVerificationResult verify(IntegrityVerificationRequest request) {
        String proof = request.proof();
        log.info(
                "RealGooglePlayIntegrityVerifier verify proofPreview={} requestHashPreview={} packageName={} allowUnverifiedTokens={}",
                logSanitizer.proofPreview(proof),
                logSanitizer.preview(request.requestHash()),
                properties.getAndroid().getPackageName(),
                properties.getAndroid().isAllowUnverifiedTokens()
        );

        if (proof == null || proof.isBlank()) {
            return IntegrityVerificationResult.failure("Android Play Integrity token is missing");
        }
        if (properties.getAndroid().getPackageName() == null || properties.getAndroid().getPackageName().isBlank()) {
            return IntegrityVerificationResult.failure("Android packageName config missing");
        }

        if (!properties.getAndroid().isAllowUnverifiedTokens()) {
            return IntegrityVerificationResult.failure(
                    "Real Google Play Integrity decode is not wired yet. Configure Google server-side verification or enable demo fallback."
            );
        }

        log.warn(
                "Accepting Android integrity token in demo fallback mode without Google server-side verification packageName={} tokenPreview={}",
                properties.getAndroid().getPackageName(),
                logSanitizer.proofPreview(proof)
        );
        return IntegrityVerificationResult.success(
                "android-device-demo",
                "Demo Android integrity token accepted without Google verification"
        );
    }
}
