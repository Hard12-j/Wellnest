package com.wellnest.analytics.event;

import com.wellnest.analytics.service.GoalSnapshotService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

@Component
public class ProfileEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(ProfileEventConsumer.class);
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final GoalSnapshotService snapshots;

    public ProfileEventConsumer(GoalSnapshotService snapshots) {
        this.snapshots = snapshots;
    }

    @KafkaListener(topics = "${analytics.profile-topic:profile.events}")
    public void onMessage(String payload) {
        ProfileEvent event;
        try {
            event = MAPPER.readValue(payload, ProfileEvent.class);
        } catch (Exception e) {
            log.warn("Skipping unreadable profile event: {}", payload, e);
            return;
        }
        snapshots.handle(event);
    }
}
