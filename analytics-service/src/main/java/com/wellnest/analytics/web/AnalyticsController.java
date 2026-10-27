package com.wellnest.analytics.web;

import com.wellnest.analytics.dto.*;
import com.wellnest.analytics.model.AssignedGoal;
import com.wellnest.analytics.service.AnalyticsQueryService;
import com.wellnest.analytics.service.GoalProgressService;
import com.wellnest.analytics.service.InsightsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Endpoints default to the last 7 days (today included). Dates are yyyy-MM-dd.
 * Trainers can pass a clientId (as a path variable or query param) to view their clients' analytics.
 */
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

    // ── Self or Client by Query Param ──

    @GetMapping("/weekly-trends")
    public WeeklyTrendsResponse weeklyTrends(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(value = "clientId", required = false) Long clientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Long targetUserId = clientId != null ? clientId : userId;
        if (targetUserId == null) {
            throw new IllegalArgumentException("User ID or clientId must be provided");
        }
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(6);
        return service.weeklyTrends(targetUserId, start, end);
    }

    @GetMapping("/calories-balance")
    public CaloriesBalanceResponse caloriesBalance(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(value = "clientId", required = false) Long clientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Long targetUserId = clientId != null ? clientId : userId;
        if (targetUserId == null) {
            throw new IllegalArgumentException("User ID or clientId must be provided");
        }
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(6);
        return service.caloriesBalance(targetUserId, start, end);
    }

    @GetMapping("/goal-progress")
    public GoalProgressResponse goalProgress(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(value = "clientId", required = false) Long clientId) {
        Long targetUserId = clientId != null ? clientId : userId;
        if (targetUserId == null) {
            throw new IllegalArgumentException("User ID or clientId must be provided");
        }
        return goalProgress.forUser(targetUserId);
    }

    @GetMapping("/insights")
    public InsightsResponse insights(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(value = "clientId", required = false) Long clientId) {
        Long targetUserId = clientId != null ? clientId : userId;
        if (targetUserId == null) {
            throw new IllegalArgumentException("User ID or clientId must be provided");
        }
        return insights.forUser(targetUserId);
    }

    // ── Real-Time Goal Cards (Workouts, Water, Sleep) ──

    @GetMapping("/goal-cards")
    public GoalCardProgressResponse goalCards(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(value = "clientId", required = false) Long clientId) {
        Long targetUserId = clientId != null ? clientId : userId;
        if (targetUserId == null) {
            throw new IllegalArgumentException("User ID or clientId must be provided");
        }
        return goalProgress.getCardGoalsProgress(targetUserId);
    }

    @GetMapping("/goals")
    public AssignedGoal getGoals(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(value = "clientId", required = false) Long clientId) {
        Long targetUserId = clientId != null ? clientId : userId;
        if (targetUserId == null) {
            throw new IllegalArgumentException("User ID or clientId must be provided");
        }
        return goalProgress.getAssignedGoal(targetUserId);
    }

    // ── Dedicated Client Endpoints for Trainers ──

    @GetMapping("/clients/{clientId}/weekly-trends")
    public WeeklyTrendsResponse clientWeeklyTrends(
            @PathVariable Long clientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(6);
        return service.weeklyTrends(clientId, start, end);
    }

    @GetMapping("/clients/{clientId}/calories-balance")
    public CaloriesBalanceResponse clientCaloriesBalance(
            @PathVariable Long clientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(6);
        return service.caloriesBalance(clientId, start, end);
    }

    @GetMapping("/clients/{clientId}/goal-progress")
    public GoalProgressResponse clientGoalProgress(@PathVariable Long clientId) {
        return goalProgress.forUser(clientId);
    }

    @GetMapping("/clients/{clientId}/insights")
    public InsightsResponse clientInsights(@PathVariable Long clientId) {
        return insights.forUser(clientId);
    }

    @GetMapping("/clients/{clientId}/goal-cards")
    public GoalCardProgressResponse clientGoalCards(@PathVariable Long clientId) {
        return goalProgress.getCardGoalsProgress(clientId);
    }

    @GetMapping("/clients/{clientId}/goals")
    public AssignedGoal clientGoals(@PathVariable Long clientId) {
        return goalProgress.getAssignedGoal(clientId);
    }

    @PostMapping("/clients/{clientId}/goals")
    public AssignedGoal assignGoals(
            @RequestHeader(value = "X-User-Id", required = false) Long trainerId,
            @PathVariable Long clientId,
            @RequestBody AssignGoalRequest req) {
        return goalProgress.assignGoal(clientId, trainerId, req);
    }
}