package com.wellnest.analytics.repo;

import com.wellnest.analytics.model.EntryType;
import com.wellnest.analytics.model.TrackerEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TrackerEntryRepository extends JpaRepository<TrackerEntry, Long> {
    Optional<TrackerEntry> findByEntryTypeAndSourceId(EntryType entryType, Long sourceId);
    List<TrackerEntry> findByUserIdAndLogDate(Long userId, LocalDate logDate);
}
