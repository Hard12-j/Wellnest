package com.wellnest.analytics.service;

import com.wellnest.analytics.dto.InsightsResponse;
import com.wellnest.analytics.repo.DailySummaryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/** Reads the user's daily_summaries and runs {@link InsightRules}. No new events or tables needed. */
@Service
public class InsightsService {

    private final DailySummaryRepository dailySummaries;
    private final InsightRules.Config config;

    public InsightsService(DailySummaryRepository dailySummaries,
                           @Value("${analytics.insights.sleep-min-hours:6.0}") double sleepMinHours,
                           @Value("${analytics.insights.sleep-days-threshold:3}") int sleepDays,
                           @Value("${analytics.insights.water-goal-ml:2000}") int waterGoalMl,
                           @Value("${analytics.insights.water-days-threshold:3}") int waterDays,
                           @Value("${analytics.insights.calorie-target:2200}") double calorieTarget,
                           @Value("${analytics.insights.surplus-days-threshold:3}") int surplusDays,
                           @Value("${analytics.insights.no-workout-days-threshold:3}") int noWorkoutDays) {
        this.dailySummaries = dailySummaries;
        this.config = new InsightRules.Config(sleepMinHours, sleepDays, waterGoalMl, waterDays,
                calorieTarget, surplusDays, noWorkoutDays);
    }

    @Transactional(readOnly = true)
    public InsightsResponse forUser(Long userId) {
        return forUser(userId, LocalDate.now());
    }

    InsightsResponse forUser(Long userId, LocalDate today) {
        List<InsightRules.Day> days = dailySummaries
                .findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, today.minusDays(InsightRules.LOOKBACK_DAYS), today)
                .stream()
                .map(s -> new InsightRules.Day(s.getLogDate(), s.getCaloriesConsumed(), s.getCaloriesBurned(),
                        s.getWorkoutCount(), s.getWaterMl(), s.getSleepHours()))
                .toList();
        return new InsightsResponse(today, InsightRules.evaluate(days, today, config));
    }
}