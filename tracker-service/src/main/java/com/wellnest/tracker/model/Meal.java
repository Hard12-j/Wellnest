package com.wellnest.tracker.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "meals", indexes = @Index(columnList = "user_id, log_date"))
public class Meal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MealType mealType;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private Integer calories;

    private Double proteinG;

    private Double carbsG;

    private Double fatG;

    protected Meal() {}
    public Meal(Long userId) { this.userId = userId; }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }
    public MealType getMealType() { return mealType; }
    public void setMealType(MealType mealType) { this.mealType = mealType; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getCalories() { return calories; }
    public void setCalories(Integer calories) { this.calories = calories; }
    public Double getProteinG() { return proteinG; }
    public void setProteinG(Double proteinG) { this.proteinG = proteinG; }
    public Double getCarbsG() { return carbsG; }
    public void setCarbsG(Double carbsG) { this.carbsG = carbsG; }
    public Double getFatG() { return fatG; }
    public void setFatG(Double fatG) { this.fatG = fatG; }
}
