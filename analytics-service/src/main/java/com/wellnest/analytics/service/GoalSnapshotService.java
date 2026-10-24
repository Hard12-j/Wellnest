package com.wellnest.analytics.service;

import com.wellnest.analytics.event.ProfileEvent;
import com.wellnest.analytics.model.ProcessedEvent;
import com.wellnest.analytics.model.UserGoalSnapshot;
import com.wellnest.analytics.repo.ProcessedEventRepository;
import com.wellnest.analytics.repo.UserGoalSnapshotRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;

/**
 * Keeps one goal snapshot per user from ProfileUpdated events.
 * startWeightKg = the weight when the user began their current plan: it is set on the first event
 * and reset whenever the goal or target weight changes. Plain weight updates leave it alone,
 * which is what makes progress % meaningful.
 */
@Service
public class GoalSnapshotService {
    private static final Logger log = LoggerFactory.getLogger(GoalSnapshotService.class);

    private final UserGoalSnapshotRepository snapshots;
    private final ProcessedEventRepository processed;

    public GoalSnapshotService(UserGoalSnapshotRepository snapshots, ProcessedEventRepository processed) {
        this.snapshots = snapshots;
        this.processed = processed;
    }

    @Transactional
    public void handle(ProfileEvent e) {
        if (e.eventId() == null || e.userId() == null || e.data() == null || e.timestamp() == null) {
            log.warn("Ignoring profile event with missing fields: {}", e);
            return;
        }
        if (!"ProfileUpdated".equals(e.eventType())) {
            log.debug("Ignoring event type {}", e.eventType());
            return;
        }
        if (processed.existsById(e.eventId())) return;
        processed.save(new ProcessedEvent(e.eventId(), Instant.now()));

        Instant ts = Instant.parse(e.timestamp());
        Double weight = dbl(e.data(), "weightKg");
        Double target = dbl(e.data(), "targetWeightKg");
        String goal = (String) e.data().get("fitnessGoal");

        UserGoalSnapshot s = snapshots.findByUserId(e.userId()).orElse(null);
        if (s == null) {
            s = new UserGoalSnapshot(e.userId());
            s.setStartWeightKg(weight);
        } else {
            if (s.getLastEventAt() != null && !ts.isAfter(s.getLastEventAt())) {
                log.debug("Stale profile event {} ignored", e.eventId());
                return;
            }
            boolean planChanged = !Objects.equals(s.getTargetWeightKg(), target)
                    || !Objects.equals(s.getFitnessGoal(), goal);
            if (planChanged || s.getStartWeightKg() == null) {
                s.setStartWeightKg(weight);
            }
        }
        s.setCurrentWeightKg(weight);
        s.setTargetWeightKg(target);
        s.setFitnessGoal(goal);
        s.setLastEventAt(ts);
        snapshots.save(s);
    }

    private static Double dbl(Map<String, Object> data, String key) {
        Object v = data.get(key);
        return v == null ? null : ((Number) v).doubleValue();
    }
}
