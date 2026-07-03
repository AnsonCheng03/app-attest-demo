package com.anson12666.integritydemo.controller;

import com.anson12666.integritydemo.dto.SaveNotesRequest;
import com.anson12666.integritydemo.dto.SaveNotesResponse;
import com.anson12666.integritydemo.dto.UserDataResponse;
import com.anson12666.integritydemo.integrity.RequireIntegrity;
import com.anson12666.integritydemo.model.AuthenticatedUser;
import com.anson12666.integritydemo.model.IntegrityAction;
import com.anson12666.integritydemo.service.auth.AuthTokenResolver;
import com.anson12666.integritydemo.service.data.UserNotesService;
import com.anson12666.integritydemo.service.support.LogSanitizer;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
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
    private final UserNotesService userNotesService;
    private final LogSanitizer logSanitizer;

    public MeController(
            AuthTokenResolver authTokenResolver,
            UserNotesService userNotesService,
            LogSanitizer logSanitizer
    ) {
        this.authTokenResolver = authTokenResolver;
        this.userNotesService = userNotesService;
        this.logSanitizer = logSanitizer;
    }

    @PostMapping("/data/save-notes")
    @RequireIntegrity(value = IntegrityAction.saveNotes, authenticated = true)
    public SaveNotesResponse saveNotes(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody SaveNotesRequest request
    ) {
        log.info(
                "HTTP POST /me/data/save-notes authorization={} platform={} challengeId={} proofPreview={} notesPreview={}",
                logSanitizer.bearerPreview(authorization),
                request.integrity().platform(),
                request.integrity().challengeId(),
                logSanitizer.proofPreview(request.integrity().proof()),
                logSanitizer.preview(request.notes())
        );
        AuthenticatedUser user = authTokenResolver.requireBearer(authorization);
        String savedNotes = userNotesService.saveNotes(user.userId(), request.notes());
        log.info("Notes saved userId={} username={}", user.userId(), user.username());
        return new SaveNotesResponse("saved", savedNotes);
    }

    @GetMapping("/data")
    public UserDataResponse getData(@RequestHeader("Authorization") String authorization) {
        log.info("HTTP GET /me/data authorization={}", logSanitizer.bearerPreview(authorization));
        AuthenticatedUser user = authTokenResolver.requireBearer(authorization);
        String notes = userNotesService.getNotes(user.userId());
        log.info("Data returned userId={} username={} notesPreview={}", user.userId(), user.username(), logSanitizer.preview(notes));
        return new UserDataResponse(user.userId(), user.username(), notes);
    }
}
