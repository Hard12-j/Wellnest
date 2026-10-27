package com.wellnest.trainer.service;

import com.wellnest.trainer.dto.PlanRequest;
import com.wellnest.trainer.dto.PlanResponse;
import com.wellnest.trainer.event.TrainerEventPublisher;
import com.wellnest.trainer.model.Plan;
import com.wellnest.trainer.repository.PlanRepository;
import com.wellnest.trainer.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlanService {

    private final PlanRepository plans;
    private final TrainerRequestService requests;
    private final TrainerEventPublisher events;

    public PlanService(PlanRepository plans, TrainerRequestService requests, TrainerEventPublisher events) {
        this.plans = plans;
        this.requests = requests;
        this.events = events;
    }

    /** A trainer can only assign plans to users whose request they accepted. */
    @Transactional
    public PlanResponse assign(Long trainerId, PlanRequest r) {
        if (!requests.isClient(trainerId, r.userId()))
            throw new ApiException(HttpStatus.FORBIDDEN, "This user is not your client");
        Plan p = new Plan();
        p.setTrainerId(trainerId);
        p.setUserId(r.userId());
        p.setTitle(r.title().trim());
        p.setDetails(r.details().trim());
        plans.save(p);
        events.planAssigned(p);
        return PlanResponse.from(p);
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> forUser(Long userId) {
        return plans.findByUserIdOrderByCreatedAtDesc(userId).stream().map(PlanResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> givenBy(Long trainerId) {
        return plans.findByTrainerIdOrderByCreatedAtDesc(trainerId).stream().map(PlanResponse::from).toList();
    }
}
