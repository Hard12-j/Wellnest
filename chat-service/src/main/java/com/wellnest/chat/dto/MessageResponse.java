package com.wellnest.chat.dto;

import com.wellnest.chat.model.ChatMessage;

import java.time.Instant;

public record MessageResponse(Long id, Long conversationId, Long senderId, String content,
                              Instant sentAt, Instant readAt) {
    public static MessageResponse of(ChatMessage m) {
        return new MessageResponse(m.getId(), m.getConversationId(), m.getSenderId(),
                m.getContent(), m.getSentAt(), m.getReadAt());
    }
}
