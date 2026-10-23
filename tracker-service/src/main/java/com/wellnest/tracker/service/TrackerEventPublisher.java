package com.wellnest.tracker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * WorkoutLogged / MealLogged / WaterLogged / SleepLogged. Only logged for now;
 * swap the body for a KafkaTemplate send when Kafka is added.
 * "action" (CREATED/UPDATED/DELETED) lets analytics keep its daily summaries correct on edits and deletes.
 */
@Component
public class TrackerEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(TrackerEventPublisher.class);

    public void publish(String eventType, Long userId, String action, Map<String, Object> data) {
        log.info("{} eventId={} userId={} timestamp={} action={} data={}",
                eventType, UUID.randomUUID(), userId, Instant.now(), action, data);
    }
}
