package com.wellnest.analytics.service;

import com.wellnest.analytics.event.TrackerEvent;
import com.wellnest.analytics.model.*;
import com.wellnest.analytics.repo.DailySummaryRepository;
import com.wellnest.analytics.repo.ProcessedEventRepository;
import com.wellnest.analytics.repo.TrackerEntryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Applies one tracker event: upsert/delete the matching tracker_entries row, then rebuild the
 * daily_summary for every day it touched (the old day too, if an edit moved the log to another date).
 * Rebuilding from entries (instead of adding deltas) keeps UPDATED and DELETED events correct.
 */
@Service
public class SummaryService {
    private static final Logger log = LoggerFactory.getLogger(SummaryService.class);

    private final TrackerEntryRepository entries;
    private final DailySummaryRepository dailySummaries;
    private final ProcessedEventRepository processed;

    public SummaryService(TrackerEntryRepository entries, DailySummaryRepository dailySummaries,
                          ProcessedEventRepository processed) {
        this.entries = entries;
        this.dailySummaries = dailySummaries;
        this.processed = processed;
    }

    @Transactional
    public void handle(TrackerEvent e) {
        if (e.eventId() == null || e.userId() == null || e.data() == null || e.timestamp() == null) {
            log.warn("Ignoring event with missing fields: {}", e);
            return;
        }
        if (processed.existsById(e.eventId())) {
            log.debug("Duplicate event {} ignored", e.eventId());
            return;
        }
        EntryType type = typeOf(e.eventType());
        if (type == null) {
            log.debug("Ignoring event type {}", e.eventType());
            return;
        }
        processed.save(new ProcessedEvent(e.eventId(), Instant.now()));

        long sourceId = ((Number) e.data().get("id")).longValue();
        Instant ts = Instant.parse(e.timestamp());
        Optional<TrackerEntry> existing = entries.findByEntryTypeAndSourceId(type, sourceId);

        Set<LocalDate> affected = new HashSet<>();
        existing.ifPresent(x -> affected.add(x.getLogDate()));

        if ("DELETED".equals(e.action())) {
            existing.ifPresent(entries::delete);
        } else if (existing.isEmpty() || ts.isAfter(existing.get().getLastEventAt())) {
            TrackerEntry entry = existing.orElseGet(() -> new TrackerEntry(type, sourceId, e.userId()));
            fill(entry, type, e.data(), ts);
            entries.save(entry);
            affected.add(entry.getLogDate());
        } else {
            log.debug("Stale event {} for {} {} ignored", e.eventId(), type, sourceId);
        }

        for (LocalDate date : affected) {
            rebuild(e.userId(), date);
        }
    }

    private void fill(TrackerEntry entry, EntryType type, Map<String, Object> data, Instant ts) {
        entry.setLogDate(LocalDate.parse((String) data.get("date")));
        entry.setLastEventAt(ts);
        switch (type) {
            case WORKOUT -> {
                entry.setCalories(num(data, "caloriesBurned"));
                entry.setDurationMin((int) num(data, "durationMin"));
            }
            case MEAL -> entry.setCalories(num(data, "calories"));
            case WATER -> entry.setAmountMl((int) num(data, "amountMl"));
            case SLEEP -> entry.setSleepHours(num(data, "hours"));
        }
    }

    private void rebuild(Long userId, LocalDate date) {
        List<TrackerEntry> rows = entries.findByUserIdAndLogDate(userId, date);
        Optional<DailySummary> existing = dailySummaries.findByUserIdAndLogDate(userId, date);
        if (rows.isEmpty()) {
            existing.ifPresent(dailySummaries::delete);
            return;
        }
        DailySummary s = existing.orElseGet(() -> new DailySummary(userId, date));
        double consumed = 0, burned = 0, sleep = 0;
        int workouts = 0, minutes = 0, water = 0;
        for (TrackerEntry t : rows) {
            switch (t.getEntryType()) {
                case WORKOUT -> {
                    workouts++;
                    burned += nz(t.getCalories());
                    minutes += t.getDurationMin() == null ? 0 : t.getDurationMin();
                }
                case MEAL -> consumed += nz(t.getCalories());
                case WATER -> water += t.getAmountMl() == null ? 0 : t.getAmountMl();
                case SLEEP -> sleep += nz(t.getSleepHours());
            }
        }
        s.setCaloriesConsumed(round1(consumed));
        s.setCaloriesBurned(round1(burned));
        s.setWorkoutCount(workouts);
        s.setWorkoutMinutes(minutes);
        s.setWaterMl(water);
        s.setSleepHours(round1(sleep));
        dailySummaries.save(s);
    }

    private static EntryType typeOf(String eventType) {
        if (eventType == null) return null;
        return switch (eventType) {
            case "WorkoutLogged" -> EntryType.WORKOUT;
            case "MealLogged" -> EntryType.MEAL;
            case "WaterLogged" -> EntryType.WATER;
            case "SleepLogged" -> EntryType.SLEEP;
            default -> null;
        };
    }

    private static double num(Map<String, Object> data, String key) {
        return ((Number) data.get(key)).doubleValue();
    }

    private static double nz(Double v) { return v == null ? 0 : v; }

    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
