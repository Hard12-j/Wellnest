package com.wellnest.analytics.repo;

import com.wellnest.analytics.model.UserGoalSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserGoalSnapshotRepository extends JpaRepository<UserGoalSnapshot, Long> {
    Optional<UserGoalSnapshot> findByUserId(Long userId);
}
