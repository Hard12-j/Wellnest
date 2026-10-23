package com.wellnest.tracker.repo;

import com.wellnest.tracker.model.HydrationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HydrationRepository extends JpaRepository<HydrationLog, Long> {
    Page<HydrationLog> findByUserIdAndLogDateBetween(Long userId, LocalDate from, LocalDate to, Pageable pageable);
    List<HydrationLog> findByUserIdAndLogDateOrderByIdAsc(Long userId, LocalDate date);
    Optional<HydrationLog> findByIdAndUserId(Long id, Long userId);
}
