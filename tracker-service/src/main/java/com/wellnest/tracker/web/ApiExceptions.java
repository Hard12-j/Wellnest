package com.wellnest.tracker.web;

public final class ApiExceptions {
    private ApiExceptions() {}

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String m) { super(m); }
    }

    public static class ConflictException extends RuntimeException {
        public ConflictException(String m) { super(m); }
    }
}
