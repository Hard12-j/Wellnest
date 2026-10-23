package com.wellnest.tracker.dto;

import com.wellnest.tracker.model.MealType;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record MealRequest(
        @NotNull @PastOrPresent LocalDate date,
        @NotNull MealType mealType,
        @NotBlank @Size(max = 100) String name,
        @NotNull @Min(0) @Max(5000) Integer calories,
        @DecimalMin("0") @DecimalMax("1000") Double proteinG,
        @DecimalMin("0") @DecimalMax("1000") Double carbsG,
        @DecimalMin("0") @DecimalMax("1000") Double fatG) {}
