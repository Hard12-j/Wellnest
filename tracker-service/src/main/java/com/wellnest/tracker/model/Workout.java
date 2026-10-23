package com.wellnest.tracker.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "workouts", indexes = @Index(columnList = "user_id, log_date"))
public class Workout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkoutType type;

    @Column(nullable = false)
    private Integer durationMin;

    @Enumerated(EnumType.STRING)
    private Intensity intensity;

    private Double caloriesBurned;

    @Column(length = 500)
    private String notes;

    protected Workout() {}
    public Workout(Long userId) { this.userId = userId; }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }
    public WorkoutType getType() { return type; }
    public void setType(WorkoutType type) { this.type = type; }
    public Integer getDurationMin() { return durationMin; }
    public void setDurationMin(Integer durationMin) { this.durationMin = durationMin; }
    public Intensity getIntensity() { return intensity; }
    public void setIntensity(Intensity intensity) { this.intensity = intensity; }
    public Double getCaloriesBurned() { return caloriesBurned; }
    public void setCaloriesBurned(Double caloriesBurned) { this.caloriesBurned = caloriesBurned; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
