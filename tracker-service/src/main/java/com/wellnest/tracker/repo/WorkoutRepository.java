package com.wellnest.tracker.repo;

import com.wellnest.tracker.model.Workout;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WorkoutRepository extends JpaRepository<Workout, Long> {
    Page<Workout> findByUserIdAndLogDateBetween(Long userId, LocalDate from, LocalDate to, Pageable pageable);
    List<Workout> findByUserIdAndLogDateOrderByIdAsc(Long userId, LocalDate date);
    Optional<Workout> findByIdAndUserId(Long id, Long userId);
}
