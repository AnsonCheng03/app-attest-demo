package com.anson12666.integritydemo.service.support;

import org.springframework.stereotype.Component;

@Component
public class RequestPayloadHasher {

    private final HashingService hashingService;

    public RequestPayloadHasher(HashingService hashingService) {
        this.hashingService = hashingService;
    }

    public String loginBodyHash(String username, String password) {
        return hashingService.sha256Base64("username=" + username + "\npassword=" + password);
    }

    public String emptyBodyHash() {
        return hashingService.sha256Base64("");
    }

    public String notesBodyHash(String notes) {
        return hashingService.sha256Base64("notes=" + notes);
    }
}
