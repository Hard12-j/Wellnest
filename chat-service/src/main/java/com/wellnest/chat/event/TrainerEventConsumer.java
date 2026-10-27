package com.wellnest.chat.event;

import com.wellnest.chat.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Listens to "trainer.events". TrainerMatched: userId = the client, data.trainerId = the trainer's user id.
 * Other event types (PlanAssigned) are ignored. Idempotent: the conversation pair is unique.
 */
@Component
public class TrainerEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(TrainerEventConsumer.class);
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final ChatService chat;

    public TrainerEventConsumer(ChatService chat) { this.chat = chat; }

    @KafkaListener(topics = "${chat.trainer-topic:trainer.events}")
    public void onMessage(String json) {
        try {
            JsonNode root = MAPPER.readTree(json);
            if (!"TrainerMatched".equals(root.path("eventType").asString(""))) return;

            long userId = root.path("userId").asLong(0);
            long trainerId = root.path("data").path("trainerId").asLong(0);
            if (userId == 0 || trainerId == 0) { log.warn("TrainerMatched without ids: {}", json); return; }

            chat.openConversation(userId, trainerId);
            log.info("Conversation ready for user {} and trainer {}", userId, trainerId);
        } catch (Exception e) {
            log.error("Could not process trainer event: {}", json, e);
        }
    }
}
