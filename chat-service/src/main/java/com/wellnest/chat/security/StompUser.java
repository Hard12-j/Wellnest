package com.wellnest.chat.security;

import java.security.Principal;

/** Principal for a STOMP session. name = auth-service user id (as text). */
public record StompUser(String name, String role) implements Principal {
    @Override public String getName() { return name; }
}
