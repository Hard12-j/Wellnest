package com.wellnest.analytics.event;

import java.util.Map;

/**
 * Envelope published by profile-service on topic "profile.events" (key = userId).
 * Same shape as the tracker envelope. eventType is always "ProfileUpdated".
 * data: fitnessGoal, weightKg, targetWeightKg, heightCm, age (any of them may be null).
 */
public record ProfileEvent(String eventId,
                           String eventType,
                           Long userId,
                           String timestamp,
                           String action,
                           Map<String, Object> data) {}
