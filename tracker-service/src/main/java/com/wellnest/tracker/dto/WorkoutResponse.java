package com.wellnest.tracker.dto;

import com.wellnest.tracker.model.*;
import java.time.LocalDate;

public record WorkoutResponse(Long id, LocalDate date, WorkoutType type, Integer durationMin,
                              Intensity intensity, Double caloriesBurned, String notes) {
    public static WorkoutResponse from(Workout w) {
        return new WorkoutResponse(w.getId(), w.getLogDate(), w.getType(), w.getDurationMin(),
                w.getIntensity(), w.getCaloriesBurned(), w.getNotes());
    }
}
