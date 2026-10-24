package com.wellnest.analytics.model;

import jakarta.persistence.*;

import java.time.Instant;

/** Analytics' own copy of the user's goal and weights, fed by ProfileUpdated events. One row per user. */
@Entity
@Table(name = "user_goal_snapshots")
public class UserGoalSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    private String fitnessGoal;
    private Double startWeightKg;
    private Double currentWeightKg;
    private Double targetWeightKg;
    private Instant lastEventAt;

    protected UserGoalSnapshot() {}

    public UserGoalSnapshot(Long userId) { this.userId = userId; }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getFitnessGoal() { return fitnessGoal; }
    public void setFitnessGoal(String v) { this.fitnessGoal = v; }
    public Double getStartWeightKg() { return startWeightKg; }
    public void setStartWeightKg(Double v) { this.startWeightKg = v; }
    public Double getCurrentWeightKg() { return currentWeightKg; }
    public void setCurrentWeightKg(Double v) { this.currentWeightKg = v; }
    public Double getTargetWeightKg() { return targetWeightKg; }
    public void setTargetWeightKg(Double v) { this.targetWeightKg = v; }
    public Instant getLastEventAt() { return lastEventAt; }
    public void setLastEventAt(Instant v) { this.lastEventAt = v; }
}
