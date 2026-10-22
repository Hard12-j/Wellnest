package com.example.Auth_service.service;

import com.example.Auth_service.Exception.ApiException;
import com.example.Auth_service.Exception.InvalidTokenException;
import com.example.Auth_service.dto.*;
import com.example.Auth_service.entities.PendingRegistration;
import com.example.Auth_service.entities.Role;
import com.example.Auth_service.entities.User;
import com.example.Auth_service.repository.PendingRegistrationRepository;
import com.example.Auth_service.repository.UserRepository;
import com.example.Auth_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int OTP_MINUTES = 10;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepo;
    private final PendingRegistrationRepository pendingRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;

    /**
     * Step 1 of sign-up: nothing is written to "users" yet. The details are parked in
     * pending_registrations and a 6-digit code is emailed to the address.
     */
    @Transactional
    public MessageResponse register(RegisterRequest req) {
        String username = normalize(req.username());

        if (!req.password().equals(req.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }

        User existing = userRepo.findByUsername(username).orElse(null);
        if (existing != null && existing.isVerifiedUser()) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }

        // signing up again with the same email just replaces the earlier pending attempt
        PendingRegistration pending = pendingRepo.findByUsername(username)
                .orElseGet(PendingRegistration::new);
        enforceResendCooldown(pending);

        pending.setUsername(username);
        pending.setFirst(req.first().trim());
        pending.setLast(req.last().trim());
        pending.setPasswordHash(passwordEncoder.encode(req.password()));
        pending.setRole(req.role() == Role.TRAINER ? Role.TRAINER : Role.USER);

        String otp = issueOtp(pending);
        pendingRepo.save(pending);
        sendVerificationEmail(username, otp);   // failure rolls back, nothing is kept

        return new MessageResponse("A verification code has been sent to " + username
                + ". Enter it to finish registering.");
    }

    /**
     * Step 2 of sign-up: only a correct code creates the real user.
     */
    @Transactional(noRollbackFor = ApiException.class)
    public void verifyEmail(VerifyEmailRequest req) {
        String username = normalize(req.username());
        PendingRegistration pending = pendingRepo.findByUsername(username)
                .orElseThrow(AuthService::invalidOtp);

        if (pending.getOtpExpiry().isBefore(Instant.now())) {
            pendingRepo.delete(pending);
            throw invalidOtp();
        }
        if (pending.getAttempts() >= MAX_OTP_ATTEMPTS) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Request a new code.");
        }
        if (!passwordEncoder.matches(req.otp(), pending.getOtpHash())) {
            pending.setAttempts(pending.getAttempts() + 1);
            pendingRepo.save(pending);
            throw invalidOtp();
        }

        // an old unverified row from before this flow existed is reused instead of duplicated
        User user = userRepo.findByUsername(username).orElseGet(User::new);
        if (user.isVerifiedUser()) {
            pendingRepo.delete(pending);
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }
        user.setUsername(username);
        user.setFirst(pending.getFirst());
        user.setLast(pending.getLast());
        user.setPassword(pending.getPasswordHash());
        user.setRole(pending.getRole());
        user.setVerifiedUser(true);
        user.setEmailVerificationOtp(null);
        user.setEmailVerificationExpiry(null);
        user.setEmailVerificationAttempts(0);
        userRepo.save(user);

        pendingRepo.delete(pending);
    }

    @Transactional
    public void resendVerification(String username) {
        // silent when there is no pending sign-up, so emails can't be probed
        pendingRepo.findByUsername(normalize(username)).ifPresent(pending -> {
            enforceResendCooldown(pending);
            String otp = issueOtp(pending);
            pendingRepo.save(pending);
            sendVerificationEmail(pending.getUsername(), otp);
        });
    }

    private String issueOtp(PendingRegistration pending) {
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        Instant now = Instant.now();
        pending.setOtpHash(passwordEncoder.encode(otp));
        pending.setOtpExpiry(now.plus(OTP_MINUTES, ChronoUnit.MINUTES));
        pending.setLastSentAt(now);
        pending.setAttempts(0);
        return otp;
    }

    private void enforceResendCooldown(PendingRegistration pending) {
        if (pending.getLastSentAt() != null
                && pending.getLastSentAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Please wait a minute before requesting another code.");
        }
    }

    private void sendVerificationEmail(String to, String otp) {
        try {
            emailService.sendVerificationOtp(to, otp, OTP_MINUTES);
        } catch (MailException e) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not send the verification email. Check the address and try again.");
        }
    }

    // NOT @Transactional on purpose, see the note below
    public LoginResult login(LoginRequest req) {
        User user = userRepo.findByUsername(normalize(req.username()))
                .orElseThrow(AuthService::badCredentials);

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw badCredentials();
        }

        if (!user.isVerifiedUser()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email not verified. Please verify your email.");
        }

        return buildResult(user, refreshTokenService.create(user));
    }

    // NOT @Transactional on purpose, see the note below
    public LoginResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidTokenException("Missing refresh token");
        }
        RotationResult rotated = refreshTokenService.rotate(rawRefreshToken);
        return buildResult(rotated.user(), rotated.refreshToken());
    }

    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenService.revoke(rawRefreshToken);
        }
    }

    @Transactional
    public void forgotPassword(String username) {
        // Always succeed from the caller's view so emails can't be probed
        userRepo.findByUsername(normalize(username)).ifPresent(user -> {
            String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
            user.setPasswordResetToken(passwordEncoder.encode(otp));
            user.setResetTokenExpiry(Instant.now().plus(OTP_MINUTES, ChronoUnit.MINUTES));
            user.setResetAttempts(0);
            userRepo.save(user);
            emailService.sendVerificationOtp(user.getUsername(), otp, OTP_MINUTES);
        });
    }

    // noRollbackFor so the failed-attempt counter is saved even when we throw
    @Transactional(noRollbackFor = ApiException.class)
    public void resetPassword(ResetPasswordRequest req) {
        User user = userRepo.findByUsername(normalize(req.username()))
                .orElseThrow(AuthService::invalidOtp);

        if (user.getPasswordResetToken() == null
                || user.getResetTokenExpiry() == null
                || user.getResetTokenExpiry().isBefore(Instant.now())) {
            throw invalidOtp();
        }
        if (user.getResetAttempts() >= MAX_OTP_ATTEMPTS) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many attempts. Request a new code.");
        }
        if (!passwordEncoder.matches(req.otp(), user.getPasswordResetToken())) {
            user.setResetAttempts(user.getResetAttempts() + 1);
            userRepo.save(user);
            throw invalidOtp();
        }

        user.setPassword(passwordEncoder.encode(req.newPassword()));
        user.setPasswordResetToken(null);
        user.setResetTokenExpiry(null);
        user.setResetAttempts(0);
        userRepo.save(user);

        refreshTokenService.revokeAll(user);   // log out all devices
    }

    public UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getFirst(), u.getLast(),
                u.getUsername(), u.getRole(), u.isVerifiedUser());
    }

    private LoginResult buildResult(User user, String refreshToken) {
        AuthResponse body = new AuthResponse(
                jwtUtil.generateAccessToken(user),
                "Bearer",
                jwtUtil.getAccessExpirationMs() / 1000,
                toResponse(user));
        return new LoginResult(body, refreshToken);
    }

    private static String normalize(String s) { return s.trim().toLowerCase(); }

    private static ApiException badCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    private static ApiException invalidOtp() {
        return new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired code");
    }

    public UserResponse me(String username) {
        return userRepo.findByUsername(username)
                .map(this::toResponse)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
