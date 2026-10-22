package com.example.Auth_service.service;

import com.example.Auth_service.repository.PendingRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** Removes abandoned sign-ups (OTP expired more than an hour ago). */
@Component
@RequiredArgsConstructor
public class PendingRegistrationCleanup {

    private final PendingRegistrationRepository pendingRepo;

    @Scheduled(fixedDelay = 3_600_000)
    @Transactional
    public void purgeExpired() {
        pendingRepo.deleteByOtpExpiryBefore(Instant.now().minus(1, ChronoUnit.HOURS));
    }
}
