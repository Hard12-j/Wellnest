package com.wellnest.profile.service;

import com.wellnest.profile.model.Profile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * ProfileUpdated event (eventId, userId, timestamp + fields). Only logged for now,
 * same as auth-service; swap the body for a KafkaTemplate send once Kafka is in.
 */
@Component
public class ProfileEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(ProfileEventPublisher.class);

    public void profileUpdated(Profile p) {
        log.info("ProfileUpdated eventId={} userId={} timestamp={} goal={} weightKg={} heightCm={}",
                UUID.randomUUID(), p.getUserId(), Instant.now(),
                p.getFitnessGoal(), p.getWeightKg(), p.getHeightCm());
    }
}
