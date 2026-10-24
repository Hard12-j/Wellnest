package com.wellnest.analytics.event;

import java.util.Map;

/**
 * Envelope published by tracker-service on topic "tracker.events" (key = userId).
 * eventType: WorkoutLogged | MealLogged | WaterLogged | SleepLogged
 * action:    CREATED | UPDATED | DELETED
 * timestamp: ISO-8601 instant, e.g. 2026-10-23T12:00:00.123Z
 */
public record TrackerEvent(String eventId,
                           String eventType,
                           Long userId,
                           String timestamp,
                           String action,
                           Map<String, Object> data) {}
