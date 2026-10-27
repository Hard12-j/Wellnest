package com.wellnest.analytics.dto;

public class AssignGoalRequest {
    private Integer workoutDaysPerWeek;
    private Double waterLitresPerDay;
    private Double sleepHoursPerNight;
    private String trainerName;

    public AssignGoalRequest() {}

    public AssignGoalRequest(Integer workoutDaysPerWeek, Double waterLitresPerDay, Double sleepHoursPerNight, String trainerName) {
        this.workoutDaysPerWeek = workoutDaysPerWeek;
        this.waterLitresPerDay = waterLitresPerDay;
        this.sleepHoursPerNight = sleepHoursPerNight;
        this.trainerName = trainerName;
    }

    public int getWorkoutDaysPerWeek() {
        return workoutDaysPerWeek != null ? workoutDaysPerWeek : 5;
    }

    public void setWorkoutDaysPerWeek(Integer workoutDaysPerWeek) {
        this.workoutDaysPerWeek = workoutDaysPerWeek;
    }

    public double getWaterLitresPerDay() {
        return waterLitresPerDay != null ? waterLitresPerDay : 3.0;
    }

    public void setWaterLitresPerDay(Double waterLitresPerDay) {
        this.waterLitresPerDay = waterLitresPerDay;
    }

    public double getSleepHoursPerNight() {
        return sleepHoursPerNight != null ? sleepHoursPerNight : 6.0;
    }

    public void setSleepHoursPerNight(Double sleepHoursPerNight) {
        this.sleepHoursPerNight = sleepHoursPerNight;
    }

    public String getTrainerName() {
        return trainerName;
    }

    public void setTrainerName(String trainerName) {
        this.trainerName = trainerName;
    }

    // Record-style compatibility accessors
    public int workoutDaysPerWeek() { return getWorkoutDaysPerWeek(); }
    public double waterLitresPerDay() { return getWaterLitresPerDay(); }
    public double sleepHoursPerNight() { return getSleepHoursPerNight(); }
    public String trainerName() { return getTrainerName(); }
}
