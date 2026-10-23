package com.wellnest.tracker.repo;

import com.wellnest.tracker.model.SleepLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SleepRepository extends JpaRepository<SleepLog, Long> {
    Page<SleepLog> findByUserIdAndLogDateBetween(Long userId, LocalDate from, LocalDate to, Pageable pageable);
    List<SleepLog> findByUserIdAndLogDateOrderByIdAsc(Long userId, LocalDate date);
    Optional<SleepLog> findByIdAndUserId(Long id, Long userId);

    /** Total hours already logged that day, ignoring one entry (pass -1 on create). */
    @Query("select coalesce(sum(s.hours), 0) from SleepLog s " +
            "where s.userId = :userId and s.logDate = :date and s.id <> :excludeId")
    double sumHours(@Param("userId") Long userId, @Param("date") LocalDate date,
                    @Param("excludeId") Long excludeId);
}