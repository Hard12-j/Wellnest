package com.wellnest.tracker.dto;

import jakarta.validation.constraints.NotBlank;

public record NutritionEstimateRequest(
        @NotBlank(message = "Please enter food item and quantity")
        String query
) {}

