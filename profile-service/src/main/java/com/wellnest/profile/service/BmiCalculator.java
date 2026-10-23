package com.wellnest.profile.service;

import com.wellnest.profile.dto.BmiResponse;
import com.wellnest.profile.model.FitnessGoal;

public final class BmiCalculator {
    private BmiCalculator() {}

    public static BmiResponse calculate(double heightCm, double weightKg,
                                        Double targetWeightKg, FitnessGoal goal) {
        double m = heightCm / 100.0;
        double bmi = Math.round(weightKg / (m * m) * 10.0) / 10.0;

        // WHO adult categories
        String category = bmi < 18.5 ? "Underweight"
                : bmi < 25.0 ? "Normal"
                : bmi < 30.0 ? "Overweight" : "Obese";

        String guidance = switch (category) {
            case "Underweight" -> "Your BMI is below the healthy range. Focus on nutrient-dense meals and strength training.";
            case "Normal" -> "You are in the healthy range. Keep a balanced diet and stay active to maintain it.";
            case "Overweight" -> "Your BMI is slightly above the healthy range. A modest calorie deficit with regular cardio and strength work helps.";
            default -> "Your BMI is in the obese range. Consider a gradual plan and talk to a doctor or trainer before intense changes.";
        };
        if (goal != null) guidance += " Current goal: " + goal.name().toLowerCase().replace('_', ' ') + ".";

        Double kgToTarget = targetWeightKg == null ? null
                : Math.round((targetWeightKg - weightKg) * 10.0) / 10.0;
        return new BmiResponse(bmi, category, guidance, kgToTarget);
    }
}
