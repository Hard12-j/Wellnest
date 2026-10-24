package com.wellnest.analytics.service;

import com.wellnest.analytics.dto.InsightsResponse.Insight;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * The insight rules, as plain Java with no Spring or database types so they are easy to unit test.
 * Input is one {@link Day} per day that has a daily summary (days with no logs are simply absent).
 *
 * "Today" is still in progress, so it can never cause a false alarm: it only counts when it already
 * supports a rule (it can extend a surplus streak or satisfy the water goal, but never break or add to a miss).
 */
public final class InsightRules {

    /** Rolling window used by the sleep and water rules ("the last 7 days", today included). */
    public static final int WINDOW_DAYS = 7;
    /** How far back the streak rules look (days before today). */
    public static final int LOOKBACK_DAYS = 14;

    public static final String NO_RECENT_DATA = "NO_RECENT_DATA";
    public static final String SHORT_SLEEP = "SHORT_SLEEP";
    public static final String LOW_WATER = "LOW_WATER";
    public static final String CALORIE_SURPLUS = "CALORIE_SURPLUS";
    public static final String NO_WORKOUT = "NO_WORKOUT";

    public record Day(LocalDate date, double caloriesConsumed, double caloriesBurned,
                      int workoutCount, int waterMl, double sleepHours) {}

    public record Config(double sleepMinHours, int sleepDaysThreshold,
                         int waterGoalMl, int waterDaysThreshold,
                         double calorieTarget, int surplusDaysThreshold,
                         int noWorkoutDaysThreshold) {
        public static Config defaults() { return new Config(6.0, 3, 2000, 3, 2200, 3, 3); }
    }

    private InsightRules() {}

    public static List<Insight> evaluate(List<Day> days, LocalDate today, Config cfg) {
        Map<LocalDate, Day> byDate = new HashMap<>();
        for (Day d : days) {
            if (!d.date().isAfter(today) && !d.date().isBefore(today.minusDays(LOOKBACK_DAYS))) {
                byDate.put(d.date(), d);
            }
        }

        LocalDate windowStart = today.minusDays(WINDOW_DAYS - 1);
        boolean anyInWindow = byDate.keySet().stream().anyMatch(d -> !d.isBefore(windowStart));
        List<Insight> out = new ArrayList<>();
        if (!anyInWindow) {
            out.add(new Insight(NO_RECENT_DATA, "INFO",
                    "No logs in the last " + WINDOW_DAYS + " days. Log a meal, workout, water or sleep to get insights.",
                    0, WINDOW_DAYS));
            return out;
        }

        // Short sleep: only days that actually have a sleep log can count as short.
        int shortSleep = 0;
        // Water: a day with any log and less water than the goal is a miss; today is never counted as a miss.
        int waterMissed = 0;
        for (LocalDate d = windowStart; !d.isAfter(today); d = d.plusDays(1)) {
            Day day = byDate.get(d);
            if (day == null) continue;
            if (day.sleepHours() > 0 && day.sleepHours() < cfg.sleepMinHours()) shortSleep++;
            boolean metWater = day.waterMl() >= cfg.waterGoalMl();
            if (!metWater && !d.equals(today)) waterMissed++;
        }
        if (shortSleep >= cfg.sleepDaysThreshold()) {
            out.add(new Insight(SHORT_SLEEP, "WARNING",
                    "Slept under " + num(cfg.sleepMinHours()) + " h on " + shortSleep + " of the last "
                            + WINDOW_DAYS + " days.", shortSleep, WINDOW_DAYS));
        }
        if (waterMissed >= cfg.waterDaysThreshold()) {
            out.add(new Insight(LOW_WATER, "WARNING",
                    "Water goal (" + cfg.waterGoalMl() + " ml) missed on " + waterMissed + " of the last "
                            + WINDOW_DAYS + " days.", waterMissed, WINDOW_DAYS));
        }

        // Calorie surplus streak: consecutive logged days with (eaten - burned) above the daily target.
        LocalDate cursor = isSurplus(byDate.get(today), cfg) ? today : today.minusDays(1);
        int surplusStreak = 0;
        while (!cursor.isBefore(today.minusDays(LOOKBACK_DAYS)) && isSurplus(byDate.get(cursor), cfg)) {
            surplusStreak++;
            cursor = cursor.minusDays(1);
        }
        if (surplusStreak >= cfg.surplusDaysThreshold()) {
            out.add(new Insight(CALORIE_SURPLUS, "WARNING",
                    "Net calories above " + num(cfg.calorieTarget()) + " kcal/day for " + surplusStreak
                            + " days running.", surplusStreak, LOOKBACK_DAYS));
        }

        // No workout: workout-free days ending yesterday, never counting days before the user started logging.
        Day todayDay = byDate.get(today);
        boolean workedOutToday = todayDay != null && todayDay.workoutCount() > 0;
        if (!workedOutToday) {
            LocalDate firstLogged = byDate.keySet().stream().min(LocalDate::compareTo).orElse(today);
            int idle = 0;
            LocalDate c = today.minusDays(1);
            while (idle < LOOKBACK_DAYS && !c.isBefore(firstLogged)) {
                Day d = byDate.get(c);
                if (d != null && d.workoutCount() > 0) break;
                idle++;
                c = c.minusDays(1);
            }
            if (idle >= cfg.noWorkoutDaysThreshold()) {
                String span = idle >= LOOKBACK_DAYS ? LOOKBACK_DAYS + "+" : String.valueOf(idle);
                out.add(new Insight(NO_WORKOUT, "WARNING", "No workout in " + span + " days.",
                        idle, LOOKBACK_DAYS));
            }
        }
        return out;
    }

    private static boolean isSurplus(Day d, Config cfg) {
        return d != null && d.caloriesConsumed() > 0
                && d.caloriesConsumed() - d.caloriesBurned() > cfg.calorieTarget();
    }

    private static String num(double v) {
        return v == Math.rint(v) ? String.valueOf((long) v) : String.valueOf(v);
    }
}