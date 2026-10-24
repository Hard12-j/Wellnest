package com.wellnest.analytics.event;

import com.wellnest.analytics.service.SummaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

@Component
public class TrackerEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(TrackerEventConsumer.class);
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final SummaryService summaries;

    public TrackerEventConsumer(SummaryService summaries) {
        this.summaries = summaries;
    }

    @KafkaListener(topics = "${analytics.tracker-topic:tracker.events}")
    public void onMessage(String payload) {
        TrackerEvent event;
        try {
            event = MAPPER.readValue(payload, TrackerEvent.class);
        } catch (Exception e) {
            // A message we can never parse would be retried forever, so log it and move on.
            log.warn("Skipping unreadable tracker event: {}", payload, e);
            return;
        }
        summaries.handle(event);
    }
}
