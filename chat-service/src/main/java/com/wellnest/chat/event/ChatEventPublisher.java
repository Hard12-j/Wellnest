package com.wellnest.chat.event;

import com.wellnest.chat.dto.MessageResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** MessageReceived -> topic "chat.events" (key = recipient userId). Only for recipients that are offline. */
@Component
public class ChatEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(ChatEventPublisher.class);
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final KafkaTemplate<String, String> kafka;
    private final String topic;

    public ChatEventPublisher(KafkaTemplate<String, String> kafka,
                              @Value("${chat.events-topic:chat.events}") String topic) {
        this.kafka = kafka;
        this.topic = topic;
    }

    /** userId = the recipient (the person to notify). */
    public void messageReceived(Long recipientId, Long senderId, MessageResponse m) {
        String preview = m.content().length() > 100 ? m.content().substring(0, 100) : m.content();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("conversationId", m.conversationId());
        data.put("messageId", m.id());
        data.put("senderId", senderId);
        data.put("preview", preview);

        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("eventId", UUID.randomUUID().toString());
        envelope.put("eventType", "MessageReceived");
        envelope.put("userId", recipientId);
        envelope.put("timestamp", Instant.now().toString());
        envelope.put("data", data);

        try {
            String json = MAPPER.writeValueAsString(envelope);
            kafka.send(topic, String.valueOf(recipientId), json).whenComplete((r, ex) -> {
                if (ex != null) log.error("Kafka send failed: {}", json, ex);
                else log.info("Published {}", json);
            });
        } catch (Exception e) {
            log.error("Could not publish MessageReceived for user {}", recipientId, e);
        }
    }
}
