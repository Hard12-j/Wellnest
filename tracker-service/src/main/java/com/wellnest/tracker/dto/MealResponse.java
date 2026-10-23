package com.wellnest.tracker.dto;

import com.wellnest.tracker.model.*;
import java.time.LocalDate;

public record MealResponse(Long id, LocalDate date, MealType mealType, String name, Integer calories,
                           Double proteinG, Double carbsG, Double fatG) {
    public static MealResponse from(Meal m) {
        return new MealResponse(m.getId(), m.getLogDate(), m.getMealType(), m.getName(), m.getCalories(),
                m.getProteinG(), m.getCarbsG(), m.getFatG());
    }
}
