package com.example.Auth_service.service;

import com.example.Auth_service.Exception.InvalidTokenException;
import com.example.Auth_service.dto.RotationResult;
import com.example.Auth_service.entities.RefreshToken;
import com.example.Auth_service.entities.User;
import com.example.Auth_service.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository repo;

    @Value("${jwt.refresh-expiration-days}")
    private long refreshDays;

    private final SecureRandom random = new SecureRandom();

    /** Creates a token and returns the RAW value (only the hash is stored). */
    @Transactional
    public String create(User user) {
        byte[] bytes = new byte[48];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken rt = new RefreshToken();
        rt.setTokenHash(hash(raw));
        rt.setUser(user);
        rt.setExpiresAt(Instant.now().plus(refreshDays, ChronoUnit.DAYS));
        repo.save(rt);
        return raw;
    }

    /** Validates the old token, revokes it, and issues a new one. */
    @Transactional(noRollbackFor = InvalidTokenException.class)
    public RotationResult rotate(String raw) {
        RefreshToken old = repo.findByTokenHash(hash(raw))
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (old.isRevoked()) {
            // A revoked token was used again: possible theft, so kill every session of this user.
            repo.revokeAllByUser(old.getUser());
            throw new InvalidTokenException("Refresh token reuse detected");
        }
        if (old.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Refresh token expired");
        }

        old.setRevoked(true);
        User user = old.getUser();
        return new RotationResult(user, create(user));
    }

    @Transactional
    public void revoke(String raw) {
        repo.findByTokenHash(hash(raw)).ifPresent(t -> t.setRevoked(true));
    }

    @Transactional
    public void revokeAll(User user) {
        repo.revokeAllByUser(user);
    }

    private String hash(String raw) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(sha.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
