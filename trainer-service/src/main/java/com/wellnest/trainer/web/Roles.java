package com.wellnest.trainer.web;

import org.springframework.http.HttpStatus;

/** The gateway forwards X-UserRole (USER / TRAINER / ADMIN). Services trust it. */
final class Roles {
    private Roles() {}

    static void require(String header, String role) {
        if (header == null || !header.toUpperCase().replace("ROLE_", "").equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only " + role + " can do this");
        }
    }
}
