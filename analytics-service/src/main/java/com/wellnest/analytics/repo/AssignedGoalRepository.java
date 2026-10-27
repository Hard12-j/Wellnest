package com.wellnest.analytics.repo;

import com.wellnest.analytics.model.AssignedGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssignedGoalRepository extends JpaRepository<AssignedGoal, Long> {
    Optional<AssignedGoal> findByUserId(Long userId);
}
