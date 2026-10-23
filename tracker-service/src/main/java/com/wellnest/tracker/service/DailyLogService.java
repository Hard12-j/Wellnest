package com.wellnest.tracker.service;

import com.wellnest.tracker.dto.*;
import com.wellnest.tracker.model.HydrationLog;
import com.wellnest.tracker.repo.*;
import com.wellnest.tracker.repo.SleepRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/** Everything one user logged on one day: powers the daily-log page. */
@Service
public class DailyLogService {

    private final WorkoutRepository workouts;
    private final MealRepository meals;
    private final HydrationRepository hydration;
    private final SleepRepository sleep;

    public DailyLogService(WorkoutRepository workouts, MealRepository meals,
                           HydrationRepository hydration, SleepRepository sleep) {
        this.workouts = workouts;
        this.meals = meals;
        this.hydration = hydration;
        this.sleep = sleep;
    }

    @Transactional(readOnly = true)
    public DailyLogResponse forDay(Long userId, LocalDate date) {
        var w = workouts.findByUserIdAndLogDateOrderByIdAsc(userId, date).stream().map(WorkoutResponse::from).toList();
        var m = meals.findByUserIdAndLogDateOrderByIdAsc(userId, date).stream().map(MealResponse::from).toList();
        int waterMl = hydration.findByUserIdAndLogDateOrderByIdAsc(userId, date).stream()
                .mapToInt(HydrationLog::getAmountMl).sum();
        var s = sleep.findByUserIdAndLogDateOrderByIdAsc(userId, date).stream().map(SleepResponse::from).toList();
        double sleepHours = Math.round(s.stream().mapToDouble(SleepResponse::hours).sum() * 10.0) / 10.0;

        double burned = Math.round(w.stream().mapToDouble(WorkoutResponse::caloriesBurned).sum() * 10.0) / 10.0;
        int consumed = m.stream().mapToInt(MealResponse::calories).sum();
        return new DailyLogResponse(date, w, m, waterMl, s, sleepHours, burned, consumed,
                Math.round((consumed - burned) * 10.0) / 10.0);
    }
}
