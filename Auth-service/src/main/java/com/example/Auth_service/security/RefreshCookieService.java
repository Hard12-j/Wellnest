package com.example.Auth_service.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class RefreshCookieService {

    public static final String NAME = "refresh_token";

    private final long refreshDays;
    private final boolean secure;
    private final String sameSite;

    public RefreshCookieService(@Value("${jwt.refresh-expiration-days}") long refreshDays,
                                @Value("${app.cookie.secure:false}") boolean secure,
                                @Value("${app.cookie.same-site:Lax}") String sameSite) {
        this.refreshDays = refreshDays;
        this.secure = secure;
        this.sameSite = sameSite;
    }

    public String create(String rawToken) {
        return build(rawToken, Duration.ofDays(refreshDays)).toString();
    }

    public String clear() {
        return build("", Duration.ZERO).toString();
    }

    private ResponseCookie build(String value, Duration maxAge) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)          // JavaScript can't read it
                .secure(secure)
                .sameSite(sameSite)
                .path("/auth")           // sent only to /auth/* endpoints
                .maxAge(maxAge)
                .build();
    }
}
