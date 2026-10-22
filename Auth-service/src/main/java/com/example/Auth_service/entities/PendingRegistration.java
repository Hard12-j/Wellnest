package com.example.Auth_service.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A sign-up that has not been email-verified yet. The real User row is created
 * only after the OTP is confirmed, so unverified emails never end up in "users".
 */
@Entity
@Table(name = "pending_registrations")
@Getter
@Setter
@NoArgsConstructor
public class PendingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;          // email

    @Column(nullable = false)
    private String first;

    @Column(nullable = false)
    private String last;

    @Column(nullable = false)
    private String passwordHash;      // BCrypt hash, never the raw password

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private String otpHash;           // BCrypt hash of the 6-digit code

    @Column(nullable = false)
    private Instant otpExpiry;

    @Column(nullable = false)
    private Instant lastSentAt;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int attempts;
}
