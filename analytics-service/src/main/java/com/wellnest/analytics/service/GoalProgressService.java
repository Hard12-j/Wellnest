package com.wellnest.analytics.service;

import com.wellnest.analytics.dto.GoalProgressResponse;
import com.wellnest.analytics.model.DailySummary;
import com.wellnest.analytics.model.UserGoalSnapshot;
import com.wellnest.analytics.repo.DailySummaryRepository;
import com.wellnest.analytics.repo.UserGoalSnapshotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GoalProgressService {

    private final UserGoalSnapshotRepository snapshots;
    private final DailySummaryRepository dailySummaries;

    public GoalProgressService(UserGoalSnapshotRepository snapshots, DailySummaryRepository dailySummaries) {
        this.snapshots = snapshots;
        this.dailySummaries = dailySummaries;
    }

    @Transactional(readOnly = true)
    public GoalProgressResponse forUser(Long userId) {
        LocalDate today = LocalDate.now();
        Set<LocalDate> logged = dailySummaries
                .findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, today.minusDays(365), today).stream()
                .map(DailySummary::getLogDate).collect(Collectors.toSet());

        // Don't show a 0 streak just because the user hasn't logged yet today.
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

    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
