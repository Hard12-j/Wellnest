package com.wellnest.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Verifies JWTs produced by auth-service (HS256, same secret).
 * Claims: sub = username, uid = userId (Long), role = "USER" | "TRAINER" | "ADMIN"
 */
@Component
public class JwtUtil {

    private final SecretKey key;

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Parse and validate the token. Throws JwtException / IllegalArgumentException
     * if the token is invalid or expired.
     */
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** Extract the user ID stored in the "uid" claim. */
    public String extractUserId(String token) {
        Claims claims = parse(token);
        Object uid = claims.get("uid");
        if (uid == null) {
            // Fallback: check sub
            String sub = claims.getSubject();
            if (sub != null) return sub;
            throw new IllegalArgumentException("Token has no uid claim");
        }
        return String.valueOf(uid);
    }

    /** Extract the role string stored in the "role" claim (e.g. "USER", "TRAINER"). */
    public String extractRole(String token) {
        Object role = parse(token).get("role");
        return role != null ? String.valueOf(role) : "USER";
    }
}
