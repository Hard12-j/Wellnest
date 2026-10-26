package com.wellnest.trainer.event;

import com.wellnest.trainer.model.UserGoal;
import com.wellnest.trainer.repository.UserGoalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;

/**
 * Listens to "profile.events" and keeps a local copy of each user's goal.
 * Idempotent: it is an upsert by userId and events older than the stored one are ignored.
 */
@Component
public class ProfileEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(ProfileEventConsumer.class);
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final UserGoalRepository goals;

    public ProfileEventConsumer(UserGoalRepository goals) { this.goals = goals; }

    @KafkaListener(topics = "${trainer.profile-topic:profile.events}")
    public void onMessage(String json) {
        try {
            JsonNode root = MAPPER.readTree(json);
            if (!"ProfileUpdated".equals(root.path("eventType").asString(""))) return;

            Long userId = root.path("userId").asLong(0);
            if (userId == 0) { log.warn("ProfileUpdated without userId: {}", json); return; }

            JsonNode goalNode = root.path("data").path("fitnessGoal");
            String goal = goalNode.isNull() || goalNode.isMissingNode() ? null : goalNode.asString();
            Instant ts = parse(root.path("timestamp").asString(null));

            UserGoal ug = goals.findById(userId).orElseGet(() -> {
                UserGoal n = new UserGoal();
                n.setUserId(userId);
                return n;
            });
            if (ug.getEventTimestamp() != null && ts != null && ts.isBefore(ug.getEventTimestamp())) return;

            ug.setFitnessGoal(goal);
            ug.setEventTimestamp(ts);
            goals.save(ug);
            log.info("Stored goal {} for user {}", goal, userId);
        } catch (Exception e) {
            log.error("Could not process profile event: {}", json, e);
        }
    }

    private static Instant parse(String s) {
        try { return s == null ? null : Instant.parse(s); } catch (Exception e) { return null; }
    }
}
