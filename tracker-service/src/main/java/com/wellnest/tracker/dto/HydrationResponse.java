package com.wellnest.tracker.dto;

import com.wellnest.tracker.model.HydrationLog;
import java.time.LocalDate;

public record HydrationResponse(Long id, LocalDate date, Integer amountMl) {
    public static HydrationResponse from(HydrationLog h) {
        return new HydrationResponse(h.getId(), h.getLogDate(), h.getAmountMl());
    }
}
