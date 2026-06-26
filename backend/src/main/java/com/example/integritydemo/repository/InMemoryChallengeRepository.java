package com.example.integritydemo.repository;

import com.example.integritydemo.model.ChallengeRecord;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryChallengeRepository implements ChallengeRepository {

    private final Map<String, ChallengeRecord> storage = new ConcurrentHashMap<>();

    @Override
    public void save(ChallengeRecord record) {
        deleteExpired();
        storage.put(record.challengeId(), record);
    }

    @Override
    public Optional<ChallengeRecord> findById(String challengeId) {
        deleteExpired();
        return Optional.ofNullable(storage.get(challengeId));
    }

    @Override
    public void markUsed(String challengeId) {
        storage.computeIfPresent(challengeId, (ignored, existing) -> existing.markUsed());
    }

    @Override
    public void deleteExpired() {
        Instant now = Instant.now();
        storage.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }
}
