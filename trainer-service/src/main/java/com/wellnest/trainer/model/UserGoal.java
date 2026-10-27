package com.wellnest.trainer.model;

import jakarta.persistence.*;
import java.time.Instant;

/** Local copy of a user's fitness goal, kept up to date from ProfileUpdated events. */
@Entity
@Table(name = "user_goals")
public class UserGoal {
    @Id
    private Long userId;
    private String fitnessGoal;
    private Instant eventTimestamp;      // timestamp of the last applied event (older ones are ignored)

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getFitnessGoal() { return fitnessGoal; }
    public void setFitnessGoal(String g) { this.fitnessGoal = g; }
    public Instant getEventTimestamp() { return eventTimestamp; }
    public void setEventTimestamp(Instant t) { this.eventTimestamp = t; }
}
