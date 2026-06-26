package com.example.integritydemo.repository;

import com.example.integritydemo.model.ChallengeRecord;

import java.util.Optional;

public interface ChallengeRepository {
    void save(ChallengeRecord record);

    Optional<ChallengeRecord> findById(String challengeId);

    void markUsed(String challengeId);

    void deleteExpired();
}
