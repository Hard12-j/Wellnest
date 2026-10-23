package com.wellnest.profile.dto;

import com.wellnest.profile.model.FitnessGoal;
import jakarta.validation.constraints.*;

public record ProfileRequest(
        @Min(10) @Max(120) Integer age,
        @DecimalMin("50.0") @DecimalMax("260.0") Double heightCm,
        @DecimalMin("20.0") @DecimalMax("500.0") Double weightKg,
        @DecimalMin("20.0") @DecimalMax("500.0") Double targetWeightKg,
        FitnessGoal fitnessGoal) {}
