package com.wellnest.analytics.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "assigned_goals")
public class AssignedGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    private Long trainerId;
    private String assignedByName;

    private int workoutDaysPerWeek = 5;
    private double waterLitresPerDay = 3.0;
    private double sleepHoursPerNight = 6.0;

    private Instant updatedAt;

    public AssignedGoal() {}

    public AssignedGoal(Long userId) {
        this.userId = userId;
        this.assignedByName = "Your goal";
        this.workoutDaysPerWeek = 5;
        this.waterLitresPerDay = 3.0;
        this.sleepHoursPerNight = 6.0;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getTrainerId() { return trainerId; }
    public void setTrainerId(Long trainerId) { this.trainerId = trainerId; }
    public String getAssignedByName() { return assignedByName; }
    public void setAssignedByName(String assignedByName) { this.assignedByName = assignedByName; }
    public int getWorkoutDaysPerWeek() { return workoutDaysPerWeek; }
    public void setWorkoutDaysPerWeek(int workoutDaysPerWeek) { this.workoutDaysPerWeek = workoutDaysPerWeek; }
    public double getWaterLitresPerDay() { return waterLitresPerDay; }
    public void setWaterLitresPerDay(double waterLitresPerDay) { this.waterLitresPerDay = waterLitresPerDay; }
    public double getSleepHoursPerNight() { return sleepHoursPerNight; }
    public void setSleepHoursPerNight(double sleepHoursPerNight) { this.sleepHoursPerNight = sleepHoursPerNight; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
