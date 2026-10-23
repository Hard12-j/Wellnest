package com.wellnest.tracker.repo;

import com.wellnest.tracker.model.Meal;
import com.wellnest.tracker.model.MealType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MealRepository extends JpaRepository<Meal, Long> {
    Page<Meal> findByUserIdAndLogDateBetween(Long userId, LocalDate from, LocalDate to, Pageable pageable);
    Page<Meal> findByUserIdAndMealTypeAndLogDateBetween(Long userId, MealType type, LocalDate from, LocalDate to, Pageable pageable);
    List<Meal> findByUserIdAndLogDateOrderByIdAsc(Long userId, LocalDate date);
    Optional<Meal> findByIdAndUserId(Long id, Long userId);
}
