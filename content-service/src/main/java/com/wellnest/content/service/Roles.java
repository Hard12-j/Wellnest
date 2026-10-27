package com.wellnest.content.service;

/** Helpers for the X-User-Role header forwarded by the gateway. Roles: USER, TRAINER. */
public final class Roles {

    public static final String USER = "USER";
    public static final String TRAINER = "TRAINER";

    private Roles() {}

    public static String normalize(String role) {
        if (role == null) return "";
        String r = role.trim().toUpperCase();
        return r.startsWith("ROLE_") ? r.substring(5) : r;
    }

    public static boolean canWriteArticles(String role) {
        return TRAINER.equals(normalize(role));
    }

    public static boolean canWritePosts(String role) {
        String normalized = normalize(role);
        return USER.equals(normalized) || TRAINER.equals(normalized);
    }

    public static boolean canWriteBlogs(String role) {
        return canWriteArticles(role);
    }
}
