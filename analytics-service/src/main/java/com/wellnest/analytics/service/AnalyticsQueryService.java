package com.wellnest.analytics.service;

import com.wellnest.analytics.dto.CaloriesBalanceResponse;
import com.wellnest.analytics.dto.CaloriesBalanceResponse.BalanceDay;
import com.wellnest.analytics.dto.WeeklyTrendsResponse;
import com.wellnest.analytics.dto.WeeklyTrendsResponse.DayPoint;
import com.wellnest.analytics.model.DailySummary;
import com.wellnest.analytics.repo.DailySummaryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AnalyticsQueryService {
    private static final int MAX_DAYS = 90;

    private final DailySummaryRepository repo;

    public AnalyticsQueryService(DailySummaryRepository repo) { this.repo = repo; }

    @Transactional(readOnly = true)
    public WeeklyTrendsResponse weeklyTrends(Long userId, LocalDate from, LocalDate to) {
        return new WeeklyTrendsResponse(from, to, points(userId, from, to));
    }

    @Transactional(readOnly = true)
    public CaloriesBalanceResponse caloriesBalance(Long userId, LocalDate from, LocalDate to) {
        List<DayPoint> pts = points(userId, from, to);
        List<BalanceDay> days = pts.stream()
                .map(p -> new BalanceDay(p.date(), p.caloriesConsumed(), p.caloriesBurned(), p.netCalories()))
                .toList();
        double consumed = pts.stream().mapToDouble(DayPoint::caloriesConsumed).sum();
        double burned = pts.stream().mapToDouble(DayPoint::caloriesBurned).sum();
        return new CaloriesBalanceResponse(from, to, days, round1(consumed), round1(burned), round1(consumed - burned));
    }

    /** One point per calendar day in [from, to]; days with no logs are zero-filled so charts have no gaps. */
    private List<DayPoint> points(Long userId, LocalDate from, LocalDate to) {
        if (from.isAfter(to)) throw new IllegalArgumentException("'from' must not be after 'to'");
        if (from.datesUntil(to.plusDays(1)).count() > MAX_DAYS) {
            throw new IllegalArgumentException("Range too large (max " + MAX_DAYS + " days)");
        }
        Map<LocalDate, DailySummary> byDate = repo
                .findByUserIdAndLogDateBetweenOrderByLogDateAsc(userId, from, to).stream()
                .collect(Collectors.toMap(DailySummary::getLogDate, Function.identity()));
        return from.datesUntil(to.plusDays(1)).map(d -> {
            DailySummary s = byDate.get(d);
            if (s == null) return new DayPoint(d, 0, 0, 0, 0, 0, 0, 0, false);
            return new DayPoint(d, s.getCaloriesConsumed(), s.getCaloriesBurned(),
                    round1(s.getCaloriesConsumed() - s.getCaloriesBurned()),
                    s.getWorkoutCount(), s.getWorkoutMinutes(), s.getWaterMl(), s.getSleepHours(), true);
        }).toList();
    }

    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
