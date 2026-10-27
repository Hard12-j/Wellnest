package com.wellnest.trainer.service;

import com.wellnest.trainer.dto.PageResponse;
import com.wellnest.trainer.dto.TrainerProfileRequest;
import com.wellnest.trainer.dto.TrainerProfileResponse;
import com.wellnest.trainer.model.RequestStatus;
import com.wellnest.trainer.model.TrainerProfile;
import com.wellnest.trainer.model.TrainerRequest;
import com.wellnest.trainer.model.UserGoal;
import com.wellnest.trainer.repository.TrainerProfileRepository;
import com.wellnest.trainer.repository.TrainerRequestRepository;
import com.wellnest.trainer.repository.UserGoalRepository;
import com.wellnest.trainer.web.ApiException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TrainerProfileService {

    private final TrainerProfileRepository trainers;
    private final TrainerRequestRepository requests;
    private final UserGoalRepository goals;

    public TrainerProfileService(TrainerProfileRepository trainers, TrainerRequestRepository requests,
                                 UserGoalRepository goals) {
        this.trainers = trainers;
        this.requests = requests;
        this.goals = goals;
    }

    @Transactional
    public TrainerProfileResponse upsert(Long userId, TrainerProfileRequest r) {
        TrainerProfile t = trainers.findByUserId(userId).orElseGet(() -> {
            TrainerProfile n = new TrainerProfile();
            n.setUserId(userId);
            return n;
        });
        t.setFirst(r.first().trim());
        t.setLast(r.last().trim());
        t.setSpecialization(r.specialization().trim());
        t.setLocation(r.location());
        t.setExperienceYears(r.experienceYears());
        t.setContactNo(r.contactNo());
        t.setAvailability(r.availability());
        return TrainerProfileResponse.from(trainers.save(t), null);
    }

    @Transactional(readOnly = true)
    public TrainerProfileResponse getMine(Long trainerUserId) {
        return TrainerProfileResponse.from(find(trainerUserId), null);
    }

    @Transactional(readOnly = true)
    public TrainerProfileResponse get(Long callerId, Long trainerUserId) {
        TrainerProfile t = find(trainerUserId);
        RequestStatus status = requests.findByUserIdAndTrainerId(callerId, trainerUserId)
                .map(TrainerRequest::getStatus).orElse(null);
        return TrainerProfileResponse.from(t, status);
    }

    /** Search by name and/or specialization (q), with optional specialization and location filters. */
    @Transactional(readOnly = true)
    public PageResponse<TrainerProfileResponse> search(Long callerId, String q, String specialization,
                                                       String location, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        var result = trainers.search(clean(q), clean(specialization), clean(location),
                PageRequest.of(Math.max(page, 0), safeSize));
        Map<Long, RequestStatus> statuses = statusesFor(callerId);
        return PageResponse.of(result.map(t -> TrainerProfileResponse.from(t, statuses.get(t.getUserId()))));
    }

    /** Trainers whose specialization matches the caller's stored goal (from ProfileUpdated events). */
    @Transactional(readOnly = true)
    public List<TrainerProfileResponse> recommended(Long callerId) {
        String goal = goals.findById(callerId).map(UserGoal::getFitnessGoal).orElse(null);
        Map<Long, RequestStatus> statuses = statusesFor(callerId);

        return trainers.findAll().stream()
                .filter(t -> matches(goal, t.getSpecialization()))
                .sorted((a, b) -> Boolean.compare(b.isVerified(), a.isVerified()))
                .map(t -> TrainerProfileResponse.from(t, statuses.get(t.getUserId())))
                .toList();
    }

    // "WEIGHT_LOSS" -> "weight loss"; match the whole phrase or any word of 4+ letters.
    static boolean matches(String goal, String specialization) {
        if (goal == null || goal.isBlank() || specialization == null) return false;
        String g = goal.toLowerCase().replace('_', ' ').trim();
        String s = specialization.toLowerCase();
        if (s.contains(g) || g.contains(s)) return true;
        for (String word : g.split("\\s+")) {
            if (word.length() >= 4 && s.contains(word)) return true;
        }
        return false;
    }

    private Map<Long, RequestStatus> statusesFor(Long callerId) {
        Map<Long, RequestStatus> m = new HashMap<>();
        for (TrainerRequest r : requests.findByUserId(callerId)) m.put(r.getTrainerId(), r.getStatus());
        return m;
    }

    private TrainerProfile find(Long userId) {
        return trainers.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trainer profile not found"));
    }

    private static String clean(String s) { return s == null ? "" : s.trim(); }
}
