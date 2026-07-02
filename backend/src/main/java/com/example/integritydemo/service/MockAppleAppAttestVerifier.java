package com.example.integritydemo.service;

import com.example.integritydemo.integrity.AppIntegrityVerifier;
import com.example.integritydemo.integrity.IntegrityVerificationRequest;
import com.example.integritydemo.integrity.IntegrityVerificationResult;
import com.example.integritydemo.model.IosDeviceRecord;
import com.example.integritydemo.repository.IosDeviceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class MockAppleAppAttestVerifier implements AppIntegrityVerifier {

    private static final Logger log = LoggerFactory.getLogger(MockAppleAppAttestVerifier.class);

    private final IosDeviceRepository iosDeviceRepository;

    public MockAppleAppAttestVerifier(IosDeviceRepository iosDeviceRepository) {
        this.iosDeviceRepository = iosDeviceRepository;
    }

    @Override
    public IntegrityVerificationResult verify(IntegrityVerificationRequest request) {
        log.info("MockAppleAppAttestVerifier verify proofPreview={} requestHashPreview={}", request.proof().substring(0, Math.min(16, request.proof().length())), request.requestHash().substring(0, Math.min(16, request.requestHash().length())));
        // iOS later sends keyId + assertion, not a public key on every request.
        // The backend verifies the assertion using the public key stored during App Attest registration.
        String[] parts = request.proof().split(":", 3);
        if (parts.length != 3 || (!"mock-ios-assertion".equals(parts[0]) && !"ios-app-attest".equals(parts[0]))) {
            return IntegrityVerificationResult.failure("Malformed mock iOS proof");
        }
        String keyId = parts[1];
        String assertion = parts[2];
        log.info("Parsed iOS proof prefix={} keyId={} assertionPreview={}", parts[0], keyId, assertion.substring(0, Math.min(16, assertion.length())));
        IosDeviceRecord record = iosDeviceRepository.findByKeyId(keyId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown iOS keyId"));
        String expectedAssertion = request.requestHash() + "|" + (record.signCount() + 1);
        log.info("Loaded iOS device keyId={} signCount={} expectedAssertionPreview={}", keyId, record.signCount(), expectedAssertion.substring(0, Math.min(16, expectedAssertion.length())));
        if (!expectedAssertion.equals(assertion)) {
            return IntegrityVerificationResult.failure("Mock iOS assertion mismatch");
        }
        iosDeviceRepository.update(record.withSignCount(record.signCount() + 1));
        log.info("Mock iOS assertion accepted keyId={} newSignCount={}", keyId, record.signCount() + 1);
        return IntegrityVerificationResult.success(record.deviceId(), "Mock Apple App Attest assertion accepted");
    }
}
