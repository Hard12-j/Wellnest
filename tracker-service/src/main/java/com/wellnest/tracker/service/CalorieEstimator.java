package com.wellnest.tracker.service;

import com.wellnest.tracker.model.Intensity;
import com.wellnest.tracker.model.WorkoutType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * calories = MET x weightKg x hours. Placeholder: replace the MET table with the
 * calorie-estimation logic from the monolith if it differs.
 */
@Component
public class CalorieEstimator {

    private final double defaultWeightKg;

    public CalorieEstimator(@Value("${tracker.default-weight-kg}") double defaultWeightKg) {
        this.defaultWeightKg = defaultWeightKg;
    }

    public double estimate(WorkoutType type, Intensity intensity, int durationMin) {
        double met = switch (type) {
            case WALKING -> 3.5;
            case RUNNING -> 9.8;
            case CYCLING -> 7.5;
            case SWIMMING -> 7.0;
            case YOGA -> 3.0;
            case STRENGTH -> 5.0;
            case HIIT -> 8.0;
            case OTHER -> 4.0;
        };
        double factor = switch (intensity) {
            case LOW -> 0.8;
            case MODERATE -> 1.0;
            case HIGH -> 1.25;
        };
        return Math.round(met * factor * defaultWeightKg * (durationMin / 60.0) * 10.0) / 10.0;
    }
}
