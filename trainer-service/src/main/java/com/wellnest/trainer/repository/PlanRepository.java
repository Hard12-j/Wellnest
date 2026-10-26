package com.wellnest.trainer.repository;

import com.wellnest.trainer.model.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    List<Plan> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Plan> findByTrainerIdOrderByCreatedAtDesc(Long trainerId);
}
