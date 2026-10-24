package com.wellnest.tracker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * WorkoutLogged / MealLogged / WaterLogged / SleepLogged -> Kafka topic "tracker.events" (key = userId,
 * so one user's events stay in order). "action" (CREATED/UPDATED/DELETED) lets analytics keep its
 * daily summaries correct on edits and deletes. The send happens after the DB transaction commits,
 * so a rolled-back write never produces an event.
 */
@Component
public class TrackerEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(TrackerEventPublisher.class);
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final KafkaTemplate<String, String> kafka;
    private final String topic;

    public TrackerEventPublisher(KafkaTemplate<String, String> kafka,
                                 @Value("${tracker.events-topic:tracker.events}") String topic) {
        this.kafka = kafka;
        this.topic = topic;
    }

    public void publish(String eventType, Long userId, String action, Map<String, Object> data) {
        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("eventId", UUID.randomUUID().toString());
        envelope.put("eventType", eventType);
        envelope.put("userId", userId);
        envelope.put("timestamp", Instant.now().toString());
        envelope.put("action", action);
        envelope.put("data", data);

        String json;
        try {
            json = MAPPER.writeValueAsString(envelope);
        } catch (Exception e) {
            log.error("Could not serialize {} event for user {}", eventType, userId, e);
            return;
        }

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() { send(userId, json); }
            });
        } else {
            send(userId, json);
        }
    }

    private void send(Long userId, String json) {
        try {
            kafka.send(topic, String.valueOf(userId), json).whenComplete((result, ex) -> {
                if (ex != null) log.error("Kafka send failed: {}", json, ex);
                else log.info("Published {}", json);
            });
        } catch (Exception e) {
            // Never fail the user's request because Kafka is down; the row is already saved.
            log.error("Kafka send failed: {}", json, e);
        }
    }
}