package com.wellnest.tracker.service;

import com.wellnest.tracker.dto.WorkoutRequest;
import com.wellnest.tracker.model.Intensity;
import com.wellnest.tracker.model.Workout;
import com.wellnest.tracker.repo.WorkoutRepository;
import com.wellnest.tracker.web.ApiExceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

@Service
public class WorkoutService {

    private final WorkoutRepository repo;
    private final CalorieEstimator estimator;
    private final TrackerEventPublisher events;

    public WorkoutService(WorkoutRepository repo, CalorieEstimator estimator, TrackerEventPublisher events) {
        this.repo = repo;
        this.estimator = estimator;
        this.events = events;
    }

    @Transactional
    public Workout create(Long userId, WorkoutRequest r) {
        Workout w = new Workout(userId);
        apply(w, r);
        Workout saved = repo.save(w);
        publish(saved, "CREATED");
        return saved;
    }

    @Transactional
    public Workout update(Long userId, Long id, WorkoutRequest r) {
        Workout w = find(userId, id);
        apply(w, r);
        Workout saved = repo.save(w);
        publish(saved, "UPDATED");
        return saved;
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Workout w = find(userId, id);
        repo.delete(w);
        publish(w, "DELETED");
    }

    @Transactional(readOnly = true)
    public Workout get(Long userId, Long id) { return find(userId, id); }

    @Transactional(readOnly = true)
    public Page<Workout> list(Long userId, LocalDate from, LocalDate to, Pageable pageable) {
        return repo.findByUserIdAndLogDateBetween(userId, from, to, pageable);
    }

    private Workout find(Long userId, Long id) {
        return repo.findByIdAndUserId(id, userId).orElseThrow(() -> new NotFoundException("Workout not found"));
    }

    private void apply(Workout w, WorkoutRequest r) {
        Intensity intensity = r.intensity() != null ? r.intensity() : Intensity.MODERATE;
        w.setLogDate(r.date());
        w.setType(r.type());
        w.setDurationMin(r.durationMin());
        w.setIntensity(intensity);
        w.setNotes(r.notes());
        w.setCaloriesBurned(r.caloriesBurned() != null ? r.caloriesBurned()
                : estimator.estimate(r.type(), intensity, r.durationMin()));
    }

    private void publish(Workout w, String action) {
        events.publish("WorkoutLogged", w.getUserId(), action, Map.of(
                "id", w.getId(), "date", w.getLogDate().toString(), "type", w.getType().name(),
                "durationMin", w.getDurationMin(), "caloriesBurned", w.getCaloriesBurned()));
    }
}
