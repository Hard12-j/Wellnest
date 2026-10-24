package com.wellnest.analytics.dto;

/**
 * status: NO_PROFILE (no ProfileUpdated seen yet) | NO_TARGET | IN_PROGRESS | ACHIEVED.
 * progressPercent is 0-100 and works for losing and gaining weight alike; null when it can't be computed.
 * currentStreakDays counts consecutive days with any log, ending today (or yesterday if today has none yet).
 */
public record GoalProgressResponse(String status,
                                   String fitnessGoal,
                                   Double startWeightKg,
                                   Double currentWeightKg,
                                   Double targetWeightKg,
                                   Double changedKg,
                                   Double remainingKg,
                                   Double progressPercent,
                                   int currentStreakDays,
                                   int daysLoggedLast7) {}
