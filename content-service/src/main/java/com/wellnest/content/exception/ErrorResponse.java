package com.wellnest.content.exception;

import java.time.Instant;

/** Align field names with the error format used in auth/profile/tracker services. */
public record ErrorResponse(Instant timestamp, int status, String error, String message, String path) {
}
