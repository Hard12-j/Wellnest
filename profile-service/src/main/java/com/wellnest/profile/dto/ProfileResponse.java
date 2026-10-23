package com.wellnest.profile.dto;

import com.wellnest.profile.model.FitnessGoal;
import com.wellnest.profile.model.Profile;
import java.time.Instant;

public record ProfileResponse(Long userId, Integer age, Double heightCm, Double weightKg,
                              Double targetWeightKg, FitnessGoal fitnessGoal,
                              boolean hasAvatar, Instant updatedAt) {
    public static ProfileResponse from(Profile p) {
        return new ProfileResponse(p.getUserId(), p.getAge(), p.getHeightCm(), p.getWeightKg(),
                p.getTargetWeightKg(), p.getFitnessGoal(), p.getAvatarFile() != null, p.getUpdatedAt());
    }
}
