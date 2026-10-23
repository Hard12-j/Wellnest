package com.wellnest.tracker.dto;

import com.wellnest.tracker.model.SleepLog;
import java.time.LocalDate;

public record SleepResponse(Long id, LocalDate date, Double hours, Integer quality) {
    public static SleepResponse from(SleepLog s) {
        return new SleepResponse(s.getId(), s.getLogDate(), s.getHours(), s.getQuality());
    }
}
