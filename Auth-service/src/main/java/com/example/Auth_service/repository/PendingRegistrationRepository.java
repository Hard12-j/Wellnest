package com.example.Auth_service.repository;

import com.example.Auth_service.entities.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Long> {
    Optional<PendingRegistration> findByUsername(String username);
    void deleteByOtpExpiryBefore(Instant cutoff);
}
