package com.wellnest.profile.service;

import com.wellnest.profile.model.Profile;
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

/** ProfileUpdated -> Kafka topic "profile.events" (key = userId). Sent after the DB commit. */
@Component
public class ProfileEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(ProfileEventPublisher.class);
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final KafkaTemplate<String, String> kafka;
    private final String topic;

    public ProfileEventPublisher(KafkaTemplate<String, String> kafka,
                                 @Value("${profile.events-topic:profile.events}") String topic) {
        this.kafka = kafka;
        this.topic = topic;
    }

    public void profileUpdated(Profile p) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("fitnessGoal", p.getFitnessGoal() == null ? null : p.getFitnessGoal().name());
        data.put("weightKg", p.getWeightKg());
        data.put("targetWeightKg", p.getTargetWeightKg());
        data.put("heightCm", p.getHeightCm());
        data.put("age", p.getAge());

        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("eventId", UUID.randomUUID().toString());
        envelope.put("eventType", "ProfileUpdated");
        envelope.put("userId", p.getUserId());
        envelope.put("timestamp", Instant.now().toString());
        envelope.put("action", "UPDATED");
        envelope.put("data", data);

        String json;
        try {
            json = MAPPER.writeValueAsString(envelope);
        } catch (Exception e) {
            log.error("Could not serialize ProfileUpdated for user {}", p.getUserId(), e);
            return;
        }
        Long userId = p.getUserId();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { send(userId, json); }
            });
        } else {
            send(userId, json);
        }
    }

    private void send(Long userId, String json) {
        try {
            kafka.send(topic, String.valueOf(userId), json).whenComplete((r, ex) -> {
                if (ex != null) log.error("Kafka send failed: {}", json, ex);
                else log.info("Published {}", json);
            });
        } catch (Exception e) {
            log.error("Kafka send failed: {}", json, e);
        }
    }
}