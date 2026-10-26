package com.wellnest.trainer.dto;

import com.wellnest.trainer.model.RequestStatus;
import com.wellnest.trainer.model.TrainerRequest;
import java.time.Instant;

public record RequestResponse(Long id, Long userId, Long trainerId, RequestStatus status,
                              String userGoal, Instant createdAt, Instant respondedAt) {
    public static RequestResponse from(TrainerRequest r, String userGoal) {
        return new RequestResponse(r.getId(), r.getUserId(), r.getTrainerId(), r.getStatus(),
                userGoal, r.getCreatedAt(), r.getRespondedAt());
    }
}
