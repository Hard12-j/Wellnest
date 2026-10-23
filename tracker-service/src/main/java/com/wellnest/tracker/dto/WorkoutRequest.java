package com.wellnest.tracker.dto;

import com.wellnest.tracker.model.Intensity;
import com.wellnest.tracker.model.WorkoutType;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

/** caloriesBurned is optional: when omitted the service estimates it (MET x weight x hours). */
public record WorkoutRequest(
        @NotNull @PastOrPresent LocalDate date,
        @NotNull WorkoutType type,
        @NotNull @Min(1) @Max(720) Integer durationMin,
        Intensity intensity,
        @DecimalMin("0") @DecimalMax("5000") Double caloriesBurned,
        @Size(max = 500) String notes) {}
