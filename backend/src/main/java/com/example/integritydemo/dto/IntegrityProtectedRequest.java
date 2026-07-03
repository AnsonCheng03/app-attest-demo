package com.example.integritydemo.dto;

import com.example.integritydemo.service.RequestPayloadHasher;

public interface IntegrityProtectedRequest {

    IntegrityProofDto integrity();

    String requestBodyHash(RequestPayloadHasher requestPayloadHasher);
}
