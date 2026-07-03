package com.anson12666.integritydemo.service.data;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserNotesService {

    private final Map<String, String> notesByUserId = new ConcurrentHashMap<>();

    public String saveNotes(String userId, String notes) {
        notesByUserId.put(userId, notes);
        return notes;
    }

    public String getNotes(String userId) {
        return notesByUserId.getOrDefault(userId, "");
    }
}
