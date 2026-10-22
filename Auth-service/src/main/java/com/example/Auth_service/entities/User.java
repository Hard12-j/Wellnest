package com.example.Auth_service.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String first;
    private String last;

    private int resetAttempts;

    @Column(unique = true, nullable = false)
    private String username;          // email

    @Column(nullable = false)
    private String password;          // BCrypt hash

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private boolean verifiedUser;

    private String passwordResetToken;
    private Instant resetTokenExpiry;

    private String emailVerificationOtp;
    private Instant emailVerificationExpiry;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int emailVerificationAttempts;
}