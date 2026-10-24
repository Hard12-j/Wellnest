package com.wellnest.analytics.web;

import com.wellnest.analytics.dto.CaloriesBalanceResponse;
import com.wellnest.analytics.dto.GoalProgressResponse;
import com.wellnest.analytics.dto.InsightsResponse;
import com.wellnest.analytics.dto.WeeklyTrendsResponse;
import com.wellnest.analytics.service.AnalyticsQueryService;
import com.wellnest.analytics.service.GoalProgressService;
import com.wellnest.analytics.service.InsightsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/** Both endpoints default to the last 7 days (today included). Dates are yyyy-MM-dd. */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsQueryService service;
    private final GoalProgressService goalProgress;
    private final InsightsService insights;

    public AnalyticsController(AnalyticsQueryService service, GoalProgressService goalProgress,
                               InsightsService insights) {
        this.service = service;
        this.goalProgress = goalProgress;
        this.insights = insights;
    }

    @GetMapping("/weekly-trends")
    public WeeklyTrendsResponse weeklyTrends(@RequestHeader("X-User-Id") Long userId,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(6);
        return service.weeklyTrends(userId, start, end);
    }

    @GetMapping("/calories-balance")
    public CaloriesBalanceResponse caloriesBalance(@RequestHeader("X-User-Id") Long userId,
                                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(6);
        return service.caloriesBalance(userId, start, end);
    }

    @GetMapping("/goal-progress")
    public GoalProgressResponse goalProgress(@RequestHeader("X-User-Id") Long userId) {
        return goalProgress.forUser(userId);
    }

    @GetMapping("/insights")
    public InsightsResponse insights(@RequestHeader("X-User-Id") Long userId) {
        return insights.forUser(userId);
    }
}