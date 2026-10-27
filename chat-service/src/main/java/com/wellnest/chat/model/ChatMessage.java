package com.wellnest.chat.model;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "chat_message",
       indexes = @Index(name = "idx_msg_conv_sent", columnList = "conversationId, sentAt"))
public class ChatMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private Long conversationId;
    @Column(nullable = false) private Long senderId;
    @Column(nullable = false, length = 2000) private String content;
    @Column(nullable = false) private Instant sentAt = Instant.now();
    private Instant readAt;

    public Long getId() { return id; }
    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }
}
