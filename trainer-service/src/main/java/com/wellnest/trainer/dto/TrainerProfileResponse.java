package com.wellnest.trainer.dto;

import com.wellnest.trainer.model.RequestStatus;
import com.wellnest.trainer.model.TrainerProfile;

/** requestStatus = the caller's request status with this trainer (null = none yet). */
public record TrainerProfileResponse(Long userId, String first, String last, String specialization,
                                     String location, Integer experienceYears, String contactNo,
                                     String availability, boolean verified, RequestStatus requestStatus) {

    public static TrainerProfileResponse from(TrainerProfile t, RequestStatus status) {
        return new TrainerProfileResponse(t.getUserId(), t.getFirst(), t.getLast(), t.getSpecialization(),
                t.getLocation(), t.getExperienceYears(), t.getContactNo(), t.getAvailability(),
                t.isVerified(), status);
    }
}
