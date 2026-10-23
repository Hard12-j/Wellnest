package com.wellnest.profile.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Owned by auth-service; stored as a plain value, no cross-DB join. */
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    private Integer age;
    private Double heightCm;
    private Double weightKg;
    private Double targetWeightKg;

    @Enumerated(EnumType.STRING)
    private FitnessGoal fitnessGoal;

    private String avatarFile;
    private String avatarContentType;

    private Instant updatedAt;

    protected Profile() {}

    public Profile(Long userId) { this.userId = userId; }

    @PrePersist @PreUpdate
    void touch() { this.updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public Double getHeightCm() { return heightCm; }
    public void setHeightCm(Double heightCm) { this.heightCm = heightCm; }
    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }
    public Double getTargetWeightKg() { return targetWeightKg; }
    public void setTargetWeightKg(Double targetWeightKg) { this.targetWeightKg = targetWeightKg; }
    public FitnessGoal getFitnessGoal() { return fitnessGoal; }
    public void setFitnessGoal(FitnessGoal fitnessGoal) { this.fitnessGoal = fitnessGoal; }
    public String getAvatarFile() { return avatarFile; }
    public void setAvatarFile(String avatarFile) { this.avatarFile = avatarFile; }
    public String getAvatarContentType() { return avatarContentType; }
    public void setAvatarContentType(String t) { this.avatarContentType = t; }
    public Instant getUpdatedAt() { return updatedAt; }
}
