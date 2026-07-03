package com.anson12666.integritydemo.dto;

import com.anson12666.integritydemo.service.RequestPayloadHasher;

public interface IntegrityProtectedRequest {

    IntegrityProofDto integrity();

    String requestBodyHash(RequestPayloadHasher requestPayloadHasher);
}
