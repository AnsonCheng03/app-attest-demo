package com.example.integritydemo.service;

import com.example.integritydemo.integrity.AppIntegrityVerifier;
import com.example.integritydemo.integrity.IntegrityVerificationRequest;
import com.example.integritydemo.integrity.IntegrityVerificationResult;
import com.example.integritydemo.model.IosDeviceRecord;
import com.example.integritydemo.repository.IosDeviceRepository;
import org.springframework.stereotype.Component;

@Component
public class MockAppleAppAttestVerifier implements AppIntegrityVerifier {

    private final IosDeviceRepository iosDeviceRepository;

    public MockAppleAppAttestVerifier(IosDeviceRepository iosDeviceRepository) {
        this.iosDeviceRepository = iosDeviceRepository;
    }

    @Override
    public IntegrityVerificationResult verify(IntegrityVerificationRequest request) {
        // iOS later sends keyId + assertion, not a public key on every request.
        // The backend verifies the assertion using the public key stored during App Attest registration.
        String[] parts = request.proof().split(":", 3);
        if (parts.length != 3 || (!"mock-ios-assertion".equals(parts[0]) && !"ios-app-attest".equals(parts[0]))) {
            return IntegrityVerificationResult.failure("Malformed mock iOS proof");
        }
        String keyId = parts[1];
        String assertion = parts[2];
        IosDeviceRecord record = iosDeviceRepository.findByKeyId(keyId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown iOS keyId"));
        String expectedAssertion = request.requestHash() + "|" + (record.signCount() + 1);
        if (!expectedAssertion.equals(assertion)) {
            return IntegrityVerificationResult.failure("Mock iOS assertion mismatch");
        }
        iosDeviceRepository.update(record.withSignCount(record.signCount() + 1));
        return IntegrityVerificationResult.success(record.deviceId(), "Mock Apple App Attest assertion accepted");
    }
}
