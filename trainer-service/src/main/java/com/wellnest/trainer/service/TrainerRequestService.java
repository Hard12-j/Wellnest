package com.wellnest.trainer.service;

import com.wellnest.trainer.dto.ClientResponse;
import com.wellnest.trainer.dto.RequestResponse;
import com.wellnest.trainer.event.TrainerEventPublisher;
import com.wellnest.trainer.model.RequestStatus;
import com.wellnest.trainer.model.TrainerRequest;
import com.wellnest.trainer.model.UserGoal;
import com.wellnest.trainer.repository.TrainerProfileRepository;
import com.wellnest.trainer.repository.TrainerRequestRepository;
import com.wellnest.trainer.repository.UserGoalRepository;
import com.wellnest.trainer.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class TrainerRequestService {

    private final TrainerRequestRepository requests;
    private final TrainerProfileRepository trainers;
    private final UserGoalRepository goals;
    private final TrainerEventPublisher events;

    public TrainerRequestService(TrainerRequestRepository requests, TrainerProfileRepository trainers,
                                 UserGoalRepository goals, TrainerEventPublisher events) {
        this.requests = requests;
        this.trainers = trainers;
        this.goals = goals;
        this.events = events;
    }

    /** User asks a trainer. One accepted trainer per user; a rejected request can be re-sent. */
    @Transactional
    public RequestResponse send(Long userId, Long trainerId) {
        if (userId.equals(trainerId)) throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid trainer");
        if (trainers.findByUserId(trainerId).isEmpty())
            throw new ApiException(HttpStatus.NOT_FOUND, "Trainer not found");
        if (requests.existsByUserIdAndStatus(userId, RequestStatus.ACCEPTED))
            throw new ApiException(HttpStatus.CONFLICT, "You already have a trainer assigned");

        TrainerRequest req = requests.findByUserIdAndTrainerId(userId, trainerId).orElse(null);
        if (req != null && req.getStatus() == RequestStatus.PENDING)
            throw new ApiException(HttpStatus.CONFLICT, "Request already pending");

        if (req == null) {
            req = new TrainerRequest();
            req.setUserId(userId);
            req.setTrainerId(trainerId);
        }
        req.setStatus(RequestStatus.PENDING);      // new, or re-apply after REJECTED
        req.setCreatedAt(Instant.now());
        req.setRespondedAt(null);
        return toResponse(requests.save(req));
    }

    @Transactional
    public RequestResponse accept(Long requestId, Long trainerId) {
        TrainerRequest req = ownedPending(requestId, trainerId);
        if (requests.existsByUserIdAndStatus(req.getUserId(), RequestStatus.ACCEPTED))
            throw new ApiException(HttpStatus.CONFLICT, "User already has a trainer");
        req.setStatus(RequestStatus.ACCEPTED);
        req.setRespondedAt(Instant.now());
        requests.save(req);
        events.trainerMatched(req);
        return toResponse(req);
    }

    @Transactional
    public RequestResponse reject(Long requestId, Long trainerId) {
        TrainerRequest req = ownedPending(requestId, trainerId);
        req.setStatus(RequestStatus.REJECTED);
        req.setRespondedAt(Instant.now());
        return toResponse(requests.save(req));
    }

    @Transactional(readOnly = true)
    public List<RequestResponse> pendingForTrainer(Long trainerId) {
        return requests.findByTrainerIdAndStatus(trainerId, RequestStatus.PENDING).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RequestResponse> mine(Long userId) {
        return requests.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    /** Trainer dashboard: accepted clients with their goal (from the local copy). */
    @Transactional(readOnly = true)
    public List<ClientResponse> clients(Long trainerId) {
        return requests.findByTrainerIdAndStatus(trainerId, RequestStatus.ACCEPTED).stream()
                .map(r -> new ClientResponse(r.getUserId(), goalOf(r.getUserId()), r.getRespondedAt()))
                .toList();
    }

    public boolean isClient(Long trainerId, Long userId) {
        return requests.existsByUserIdAndTrainerIdAndStatus(userId, trainerId, RequestStatus.ACCEPTED);
    }

    private TrainerRequest ownedPending(Long requestId, Long trainerId) {
        TrainerRequest req = requests.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!req.getTrainerId().equals(trainerId))
            throw new ApiException(HttpStatus.FORBIDDEN, "This request is not for you");
        if (req.getStatus() != RequestStatus.PENDING)
            throw new ApiException(HttpStatus.CONFLICT, "Request is not pending");
        return req;
    }

    private RequestResponse toResponse(TrainerRequest r) {
        return RequestResponse.from(r, goalOf(r.getUserId()));
    }

    private String goalOf(Long userId) {
        return goals.findById(userId).map(UserGoal::getFitnessGoal).orElse(null);
    }
}
