package com.wellnest.analytics.dto;

import java.time.LocalDate;
import java.util.List;

public record WeeklyTrendsResponse(LocalDate from, LocalDate to, List<DayPoint> days) {

    public record DayPoint(LocalDate date,
                           double caloriesConsumed,
                           double caloriesBurned,
                           double netCalories,
                           int workoutCount,
                           int workoutMinutes,
                           int waterMl,
                           double sleepHours,
                           boolean logged) {}
}
