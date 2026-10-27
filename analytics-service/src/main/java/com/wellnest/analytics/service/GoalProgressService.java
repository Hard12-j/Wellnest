package com.wellnest.analytics.service;

import com.wellnest.analytics.dto.AssignGoalRequest;
import com.wellnest.analytics.dto.GoalCardProgressResponse;
import com.wellnest.analytics.dto.GoalProgressResponse;
import com.wellnest.analytics.model.AssignedGoal;
import com.wellnest.analytics.model.DailySummary;
import com.wellnest.analytics.model.UserGoalSnapshot;
import com.wellnest.analytics.repo.AssignedGoalRepository;
import com.wellnest.analytics.repo.DailySummaryRepository;
import com.wellnest.analytics.repo.UserGoalSnapshotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GoalProgressService {

    private final UserGoalSnapshotRepository snapshots;
    private final DailySummaryRepository dailySummaries;
    private final AssignedGoalRepository assignedGoals;

    public GoalProgressService(UserGoalSnapshotRepository snapshots,
                               DailySummaryRepository dailySummaries,
                               AssignedGoalRepository assignedGoals) {
        this.snapshots = snapshots;
        this.dailySummaries = dailySummaries;
        this.assignedGoals = assignedGoals;
    }

    @Transactional(readOnly = true)
    public GoalProgressResponse forUser(Long userId) {
        LocalDate today = LocalDate.now();
        Set<LocalDate> logged = dailySummaries
                .findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, today.minusDays(365), today).stream()
                .map(DailySummary::getLogDate).collect(Collectors.toSet());

        LocalDate cursor = logged.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (logged.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        int last7 = (int) today.minusDays(6).datesUntil(today.plusDays(1)).filter(logged::contains).count();

        UserGoalSnapshot s = snapshots.findByUserId(userId).orElse(null);
        if (s == null) {
            return new GoalProgressResponse("NO_PROFILE", null, null, null, null, null, null, null, streak, last7);
        }

        Double start = s.getStartWeightKg(), current = s.getCurrentWeightKg(), target = s.getTargetWeightKg();
        if (start == null || current == null || target == null) {
            return new GoalProgressResponse("NO_TARGET", s.getFitnessGoal(), start, current, target,
                    null, null, null, streak, last7);
        }

        double changed = round1(current - start);
        double remaining = round1(target - current);
        Double percent = null;
        if (Math.abs(start - target) > 0.0001) {
            double raw = (start - current) / (start - target) * 100.0;
            percent = round1(Math.max(0, Math.min(100, raw)));
        }
        boolean achieved = percent != null ? percent >= 100 : Math.abs(current - target) < 0.0001;
        return new GoalProgressResponse(achieved ? "ACHIEVED" : "IN_PROGRESS", s.getFitnessGoal(),
                start, current, target, changed, remaining, achieved ? Double.valueOf(100.0) : percent, streak, last7);
    }

    /**
     * Compute real-time goal cards telemetry: Workouts, Water, and Sleep.
     * Evaluates progress against targets assigned by a trainer (or user defaults).
     */
    @Transactional(readOnly = true)
    public GoalCardProgressResponse getCardGoalsProgress(Long userId) {
        AssignedGoal goal = assignedGoals.findByUserId(userId)
                .orElseGet(() -> new AssignedGoal(userId));

        LocalDate today = LocalDate.now();

        // 1. Workouts this week (Monday to Sunday)
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        List<DailySummary> thisWeekSummaries = dailySummaries
                .findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, monday, today);

        int completedWorkoutDays = (int) thisWeekSummaries.stream()
                .filter(s -> s.getWorkoutCount() > 0 || s.getWorkoutMinutes() > 0)
                .count();

        int targetWorkoutDays = Math.max(1, goal.getWorkoutDaysPerWeek());
        int workoutPct = Math.min(100, (int) Math.round(((double) completedWorkoutDays / targetWorkoutDays) * 100));
        int moreToGo = Math.max(0, targetWorkoutDays - completedWorkoutDays);
        int daysLeftInWeek = (int) ChronoUnit.DAYS.between(today, sunday);

        String workoutBadge = goal.getTrainerId() != null && goal.getAssignedByName() != null
                ? goal.getAssignedByName()
                : "Your goal";

        String workoutTip = completedWorkoutDays >= targetWorkoutDays
                ? "Target achieved! Outstanding commitment this week."
                : (moreToGo == 1 ? "Just 1 more session to crush your weekly target!" : "A 20-minute home session still counts.");

        GoalCardProgressResponse.WorkoutsGoalCard workoutsCard = new GoalCardProgressResponse.WorkoutsGoalCard(
                workoutBadge,
                "This week, resets Monday",
                completedWorkoutDays,
                targetWorkoutDays,
                workoutPct,
                moreToGo,
                daysLeftInWeek,
                workoutTip
        );

        // 2. Water today (litres)
        double targetWaterL = Math.max(0.5, round1(goal.getWaterLitresPerDay()));
        Optional<DailySummary> todaySummaryOpt = dailySummaries.findByUserIdAndLogDate(userId, today);
        double currentWaterL = todaySummaryOpt
                .map(s -> round1(s.getWaterMl() / 1000.0))
                .orElse(0.0);

        int waterPct = Math.min(100, (int) Math.round((currentWaterL / targetWaterL) * 100));
        double remainingWaterL = Math.max(0.0, round1(targetWaterL - currentWaterL));

        // Water streak calculation
        List<DailySummary> pastMonth = dailySummaries
                .findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, today.minusDays(30), today);
        int waterStreak = 0;
        LocalDate cursor = today;
        int targetMl = (int) (targetWaterL * 1000);
        for (int i = 0; i < 30; i++) {
            LocalDate d = cursor;
            boolean met = pastMonth.stream().anyMatch(s -> s.getLogDate().equals(d) && s.getWaterMl() >= targetMl);
            if (met) {
                waterStreak++;
                cursor = cursor.minusDays(1);
            } else if (i == 0) {
                // If today isn't met yet, check from yesterday
                cursor = cursor.minusDays(1);
            } else {
                break;
            }
        }

        String waterTip = currentWaterL >= targetWaterL
                ? "Hydration goal crushed today! 💧"
                : (remainingWaterL <= 0.6 ? "Almost there. Two more glasses." : "Drink a glass before your next meal.");

        GoalCardProgressResponse.WaterGoalCard waterCard = new GoalCardProgressResponse.WaterGoalCard(
                workoutBadge,
                "Today",
                currentWaterL,
                targetWaterL,
                waterPct,
                remainingWaterL,
                waterStreak,
                waterTip
        );

        // 3. Sleep (last 7 days average)
        double targetSleepH = Math.max(4.0, round1(goal.getSleepHoursPerNight()));
        List<DailySummary> last7DaysSummaries = dailySummaries
                .findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, today.minusDays(6), today);

        double totalSleep = last7DaysSummaries.stream().mapToDouble(DailySummary::getSleepHours).sum();
        double avgSleepH = last7DaysSummaries.isEmpty() ? 0.0 : round1(totalSleep / Math.max(1, last7DaysSummaries.size()));
        double bestSleepH = last7DaysSummaries.stream().mapToDouble(DailySummary::getSleepHours).max().orElse(0.0);

        int sleepPct = Math.min(100, (int) Math.round((avgSleepH / targetSleepH) * 100));
        String comparisonText = avgSleepH >= targetSleepH
                ? "On target!"
                : String.format("%.1f h below target", round1(targetSleepH - avgSleepH));

        String sleepTip = avgSleepH >= targetSleepH
                ? "Well rested! Peak recovery achieved."
                : "Try a fixed bedtime this week.";

        GoalCardProgressResponse.SleepGoalCard sleepCard = new GoalCardProgressResponse.SleepGoalCard(
                workoutBadge,
                "Last 7 days, average",
                avgSleepH,
                targetSleepH,
                sleepPct,
                comparisonText,
                round1(bestSleepH),
                sleepTip
        );

        return new GoalCardProgressResponse(workoutsCard, waterCard, sleepCard);
    }

    /**
     * Trainer assigns custom goals to a client.
     */
    @Transactional
    public AssignedGoal assignGoal(Long userId, Long trainerId, AssignGoalRequest req) {
        AssignedGoal goal = assignedGoals.findByUserId(userId)
                .orElseGet(() -> new AssignedGoal(userId));

        goal.setTrainerId(trainerId);
        goal.setAssignedByName(req.trainerName() != null && !req.trainerName().isBlank()
                ? req.trainerName()
                : "Coach");

        if (req.workoutDaysPerWeek() > 0) {
            goal.setWorkoutDaysPerWeek(req.workoutDaysPerWeek());
        }
        if (req.waterLitresPerDay() > 0) {
            goal.setWaterLitresPerDay(round1(req.waterLitresPerDay()));
        }
        if (req.sleepHoursPerNight() > 0) {
            goal.setSleepHoursPerNight(round1(req.sleepHoursPerNight()));
        }
        goal.setUpdatedAt(Instant.now());

        return assignedGoals.save(goal);
    }

    @Transactional(readOnly = true)
    public AssignedGoal getAssignedGoal(Long userId) {
        return assignedGoals.findByUserId(userId).orElseGet(() -> new AssignedGoal(userId));
    }

    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
