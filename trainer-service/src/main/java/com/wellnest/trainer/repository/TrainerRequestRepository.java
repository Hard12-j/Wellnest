package com.wellnest.trainer.repository;

import com.wellnest.trainer.model.RequestStatus;
import com.wellnest.trainer.model.TrainerRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrainerRequestRepository extends JpaRepository<TrainerRequest, Long> {
    Optional<TrainerRequest> findByUserIdAndTrainerId(Long userId, Long trainerId);
    List<TrainerRequest> findByUserId(Long userId);
    List<TrainerRequest> findByTrainerIdAndStatus(Long trainerId, RequestStatus status);
    boolean existsByUserIdAndStatus(Long userId, RequestStatus status);
    boolean existsByUserIdAndTrainerIdAndStatus(Long userId, Long trainerId, RequestStatus status);
}
