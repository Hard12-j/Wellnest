package com.wellnest.trainer.repository;

import com.wellnest.trainer.model.UserGoal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserGoalRepository extends JpaRepository<UserGoal, Long> { }
