package com.wellnest.trainer.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "plans")
public class Plan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private Long trainerId;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false) private String title;
    @Column(nullable = false, columnDefinition = "TEXT") private String details;
    @Column(nullable = false) private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Long getTrainerId() { return trainerId; }
    public void setTrainerId(Long trainerId) { this.trainerId = trainerId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public Instant getCreatedAt() { return createdAt; }
}
