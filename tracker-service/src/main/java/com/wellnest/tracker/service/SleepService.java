package com.wellnest.tracker.service;

import com.wellnest.tracker.dto.SleepRequest;
import com.wellnest.tracker.model.SleepLog;
import com.wellnest.tracker.repo.SleepRepository;
import com.wellnest.tracker.web.ApiExceptions.ConflictException;
import com.wellnest.tracker.web.ApiExceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/** One sleep log per user per day (unique constraint + friendly 409). */
@Service
public class SleepService {

    private final SleepRepository repo;
    private final TrackerEventPublisher events;

    public SleepService(SleepRepository repo, TrackerEventPublisher events) {
        this.repo = repo;
        this.events = events;
    }

    /** Multiple sleep entries per user per day (night sleep, naps); the day's total is capped at 24h. */

    @Transactional
    public SleepLog create(Long userId, SleepRequest r) {
        checkDailyLimit(userId, r.date(), r.hours(), -1L);
        SleepLog s = new SleepLog(userId);
        apply(s, r);
        SleepLog saved = repo.save(s);
        publish(saved, "CREATED");
        return saved;
    }

    @Transactional
    public SleepLog update(Long userId, Long id, SleepRequest r) {
        SleepLog s = find(userId, id);
        checkDailyLimit(userId, r.date(), r.hours(), id);
        apply(s, r);
        SleepLog saved = repo.save(s);
        publish(saved, "UPDATED");
        return saved;
    }

    private void checkDailyLimit(Long userId, LocalDate date, double hours, Long excludeId) {
        double others = repo.sumHours(userId, date, excludeId);
        if (others + hours > 24.0 + 1e-9) {
            throw new ConflictException(String.format(
                    "Total sleep on %s cannot exceed 24 hours (%.1f already logged, %.1f left)",
                    date, others, Math.max(0, 24.0 - others)));
        }
    }

    @Transactional
    public void delete(Long userId, Long id) {
        SleepLog s = find(userId, id);
        repo.delete(s);
        publish(s, "DELETED");
    }

    @Transactional(readOnly = true)
    public SleepLog get(Long userId, Long id) { return find(userId, id); }

    @Transactional(readOnly = true)
    public Page<SleepLog> list(Long userId, LocalDate from, LocalDate to, Pageable pageable) {
        return repo.findByUserIdAndLogDateBetween(userId, from, to, pageable);
    }

    private SleepLog find(Long userId, Long id) {
        return repo.findByIdAndUserId(id, userId).orElseThrow(() -> new NotFoundException("Sleep log not found"));
    }

    private void apply(SleepLog s, SleepRequest r) {
        s.setLogDate(r.date());
        s.setHours(r.hours());
        s.setQuality(r.quality());
    }

    private void publish(SleepLog s, String action) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", s.getId());
        data.put("date", s.getLogDate().toString());
        data.put("hours", s.getHours());
        data.put("quality", s.getQuality());
        events.publish("SleepLogged", s.getUserId(), action, data);
    }
}
