package com.wellnest.chat.dto;

/** STOMP payload for /app/chat.send. The sender is NOT in here: it comes from the JWT. */
public record SendMessageRequest(Long conversationId, String content) {}
