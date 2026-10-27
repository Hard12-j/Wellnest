package com.wellnest.trainer.event;

import com.wellnest.trainer.model.Plan;
import com.wellnest.trainer.model.TrainerRequest;
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

/** TrainerMatched and PlanAssigned -> topic "trainer.events" (key = userId). Sent after the DB commit. */
@Component
public class TrainerEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(TrainerEventPublisher.class);
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final KafkaTemplate<String, String> kafka;
    private final String topic;

    public TrainerEventPublisher(KafkaTemplate<String, String> kafka,
                                 @Value("${trainer.events-topic:trainer.events}") String topic) {
        this.kafka = kafka;
        this.topic = topic;
    }

    public void trainerMatched(TrainerRequest r) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("trainerId", r.getTrainerId());
        data.put("requestId", r.getId());
        publish("TrainerMatched", r.getUserId(), data);
    }

    public void planAssigned(Plan p) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("trainerId", p.getTrainerId());
        data.put("planId", p.getId());
        data.put("title", p.getTitle());
        publish("PlanAssigned", p.getUserId(), data);
    }

    private void publish(String type, Long userId, Map<String, Object> data) {
        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("eventId", UUID.randomUUID().toString());
        envelope.put("eventType", type);
        envelope.put("userId", userId);
        envelope.put("timestamp", Instant.now().toString());
        envelope.put("data", data);

        String json;
        try {
            json = MAPPER.writeValueAsString(envelope);
        } catch (Exception e) {
            log.error("Could not serialize {} for user {}", type, userId, e);
            return;
        }
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
