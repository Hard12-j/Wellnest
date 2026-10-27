package com.wellnest.chat.dto;

import java.time.Instant;

public record ConversationResponse(Long id, Long otherUserId, String lastMessage,
                                   Instant lastMessageAt, long unreadCount) {}
