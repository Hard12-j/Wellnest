package com.wellnest.profile.web;

public final class ApiExceptions {
    private ApiExceptions() {}

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String m) { super(m); }
    }

    public static class ProfileIncompleteException extends RuntimeException {
        public ProfileIncompleteException() { super("Add your height and weight to calculate BMI"); }
    }
}
