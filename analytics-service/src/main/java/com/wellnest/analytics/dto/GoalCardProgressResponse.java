package com.wellnest.analytics.dto;

public record GoalCardProgressResponse(
        WorkoutsGoalCard workouts,
        WaterGoalCard water,
        SleepGoalCard sleep
) {
    public record WorkoutsGoalCard(
            String badge,
            String subtitle,
            int completedDays,
            int targetDays,
            int percentage,
            int moreToGo,
            int daysLeft,
            String tip
    ) {}

    public record WaterGoalCard(
            String badge,
            String subtitle,
            double currentLitres,
            double targetLitres,
            int percentage,
            double remainingLitres,
            int streakDays,
            String tip
    ) {}

    public record SleepGoalCard(
            String badge,
            String subtitle,
            double avgHours,
            double targetHours,
            int percentage,
            String comparisonText,
            double bestHours,
            String tip
    ) {}
}
