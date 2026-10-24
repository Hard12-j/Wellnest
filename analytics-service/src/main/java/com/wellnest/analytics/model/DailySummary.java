package com.wellnest.analytics.model;

import jakarta.persistence.*;

import java.time.LocalDate;

/** One row per user per day, rebuilt from tracker_entries whenever an event touches that day. */
@Entity
@Table(name = "daily_summaries",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "log_date"}))
public class DailySummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    private double caloriesConsumed;
    private double caloriesBurned;
    private int workoutCount;
    private int workoutMinutes;
    private int waterMl;
    private double sleepHours;

    protected DailySummary() {}

    public DailySummary(Long userId, LocalDate logDate) {
        this.userId = userId;
        this.logDate = logDate;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public LocalDate getLogDate() { return logDate; }
    public double getCaloriesConsumed() { return caloriesConsumed; }
    public void setCaloriesConsumed(double v) { this.caloriesConsumed = v; }
    public double getCaloriesBurned() { return caloriesBurned; }
    public void setCaloriesBurned(double v) { this.caloriesBurned = v; }
    public int getWorkoutCount() { return workoutCount; }
    public void setWorkoutCount(int v) { this.workoutCount = v; }
    public int getWorkoutMinutes() { return workoutMinutes; }
    public void setWorkoutMinutes(int v) { this.workoutMinutes = v; }
    public int getWaterMl() { return waterMl; }
    public void setWaterMl(int v) { this.waterMl = v; }
    public double getSleepHours() { return sleepHours; }
    public void setSleepHours(double v) { this.sleepHours = v; }
}
