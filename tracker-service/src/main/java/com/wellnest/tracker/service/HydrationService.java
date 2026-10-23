package com.wellnest.tracker.service;

import com.wellnest.tracker.dto.HydrationRequest;
import com.wellnest.tracker.model.HydrationLog;
import com.wellnest.tracker.repo.HydrationRepository;
import com.wellnest.tracker.web.ApiExceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

@Service
public class HydrationService {

    private final HydrationRepository repo;
    private final TrackerEventPublisher events;

    public HydrationService(HydrationRepository repo, TrackerEventPublisher events) {
        this.repo = repo;
        this.events = events;
    }

    @Transactional
    public HydrationLog create(Long userId, HydrationRequest r) {
        HydrationLog h = new HydrationLog(userId);
        h.setLogDate(r.date());
        h.setAmountMl(r.amountMl());
        HydrationLog saved = repo.save(h);
        publish(saved, "CREATED");
        return saved;
    }

    @Transactional
    public HydrationLog update(Long userId, Long id, HydrationRequest r) {
        HydrationLog h = find(userId, id);
        h.setLogDate(r.date());
        h.setAmountMl(r.amountMl());
        HydrationLog saved = repo.save(h);
        publish(saved, "UPDATED");
        return saved;
    }

    @Transactional
    public void delete(Long userId, Long id) {
        HydrationLog h = find(userId, id);
        repo.delete(h);
        publish(h, "DELETED");
    }

    @Transactional(readOnly = true)
    public HydrationLog get(Long userId, Long id) { return find(userId, id); }

    @Transactional(readOnly = true)
    public Page<HydrationLog> list(Long userId, LocalDate from, LocalDate to, Pageable pageable) {
        return repo.findByUserIdAndLogDateBetween(userId, from, to, pageable);
    }

    private HydrationLog find(Long userId, Long id) {
        return repo.findByIdAndUserId(id, userId).orElseThrow(() -> new NotFoundException("Hydration log not found"));
    }

    private void publish(HydrationLog h, String action) {
        events.publish("WaterLogged", h.getUserId(), action, Map.of(
                "id", h.getId(), "date", h.getLogDate().toString(), "amountMl", h.getAmountMl()));
    }
}
