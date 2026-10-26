package com.wellnest.trainer.dto;

import com.wellnest.trainer.model.Plan;
import java.time.Instant;

public record PlanResponse(Long id, Long trainerId, Long userId, String title, String details, Instant createdAt) {
    public static PlanResponse from(Plan p) {
        return new PlanResponse(p.getId(), p.getTrainerId(), p.getUserId(), p.getTitle(), p.getDetails(), p.getCreatedAt());
    }
}
