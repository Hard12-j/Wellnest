package com.wellnest.chat.model;

import jakarta.persistence.*;

import java.time.Instant;

/** One conversation per (user, trainer) pair. Only auth-service user ids are stored. */
@Entity
@Table(name = "conversation",
       uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "trainerId"}))
public class Conversation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private Long userId;      // the client
    @Column(nullable = false) private Long trainerId;   // trainer's auth userId
    @Column(nullable = false) private Instant createdAt = Instant.now();
    @Column(nullable = false) private Instant lastMessageAt = Instant.now();
    @Column(length = 120) private String lastMessagePreview;

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getTrainerId() { return trainerId; }
    public void setTrainerId(Long trainerId) { this.trainerId = trainerId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(Instant lastMessageAt) { this.lastMessageAt = lastMessageAt; }
    public String getLastMessagePreview() { return lastMessagePreview; }
    public void setLastMessagePreview(String lastMessagePreview) { this.lastMessagePreview = lastMessagePreview; }

    public boolean hasParticipant(Long id) { return userId.equals(id) || trainerId.equals(id); }
    public Long otherParticipant(Long id) { return userId.equals(id) ? trainerId : userId; }
}
