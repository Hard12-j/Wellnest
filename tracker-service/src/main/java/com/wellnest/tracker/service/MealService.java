package com.wellnest.tracker.service;

import com.wellnest.tracker.dto.MealRequest;
import com.wellnest.tracker.model.Meal;
import com.wellnest.tracker.model.MealType;
import com.wellnest.tracker.repo.MealRepository;
import com.wellnest.tracker.web.ApiExceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

@Service
public class MealService {

    private final MealRepository repo;
    private final TrackerEventPublisher events;

    public MealService(MealRepository repo, TrackerEventPublisher events) {
        this.repo = repo;
        this.events = events;
    }

    @Transactional
    public Meal create(Long userId, MealRequest r) {
        Meal m = new Meal(userId);
        apply(m, r);
        Meal saved = repo.save(m);
        publish(saved, "CREATED");
        return saved;
    }

    @Transactional
    public Meal update(Long userId, Long id, MealRequest r) {
        Meal m = find(userId, id);
        apply(m, r);
        Meal saved = repo.save(m);
        publish(saved, "UPDATED");
        return saved;
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Meal m = find(userId, id);
        repo.delete(m);
        publish(m, "DELETED");
    }

    @Transactional(readOnly = true)
    public Meal get(Long userId, Long id) { return find(userId, id); }

    @Transactional(readOnly = true)
    public Page<Meal> list(Long userId, MealType type, LocalDate from, LocalDate to, Pageable pageable) {
        return type == null
                ? repo.findByUserIdAndLogDateBetween(userId, from, to, pageable)
                : repo.findByUserIdAndMealTypeAndLogDateBetween(userId, type, from, to, pageable);
    }

    private Meal find(Long userId, Long id) {
        return repo.findByIdAndUserId(id, userId).orElseThrow(() -> new NotFoundException("Meal not found"));
    }

    private void apply(Meal m, MealRequest r) {
        m.setLogDate(r.date());
        m.setMealType(r.mealType());
        m.setName(r.name().trim());
        m.setCalories(r.calories());
        m.setProteinG(r.proteinG());
        m.setCarbsG(r.carbsG());
        m.setFatG(r.fatG());
    }

    private void publish(Meal m, String action) {
        events.publish("MealLogged", m.getUserId(), action, Map.of(
                "id", m.getId(), "date", m.getLogDate().toString(),
                "mealType", m.getMealType().name(), "calories", m.getCalories()));
    }
}
