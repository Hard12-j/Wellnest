package com.wellnest.tracker.dto;

import java.time.LocalDate;
import java.util.List;

public record DailyLogResponse(LocalDate date,
                               List<WorkoutResponse> workouts,
                               List<MealResponse> meals,
                               int hydrationMl,
                               List<SleepResponse> sleep,
                               double sleepHours,
                               double caloriesBurned,
                               int caloriesConsumed,
                               double netCalories) {}
