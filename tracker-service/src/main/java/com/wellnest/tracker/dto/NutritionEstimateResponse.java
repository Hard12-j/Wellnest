package com.wellnest.tracker.dto;

public record NutritionEstimateResponse(
        String foodName,
        Integer calories,
        Double proteinG,
        Double carbsG,
        Double fatG,
        String source,
        String breakdown
) {}

