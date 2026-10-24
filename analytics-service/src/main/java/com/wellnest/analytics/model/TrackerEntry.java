package com.wellnest.analytics.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Analytics' own copy of one tracker row (one workout, one meal, ...), keyed by the tracker row id.
 * Upserting by (entryType, sourceId) makes edits, date changes and deletes easy to get right,
 * and the daily summary is always re-derived from these rows.
 */
@Entity
@Table(name = "tracker_entries",
        uniqueConstraints = @UniqueConstraint(columnNames = {"entry_type", "source_id"}),
        indexes = @Index(columnList = "user_id, log_date"))
public class TrackerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false)
    private EntryType entryType;

    @Column(name = "source_id", nullable = false)
    private Long sourceId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    /** WORKOUT: calories burned. MEAL: calories consumed. */
    private Double calories;
    private Integer durationMin;
    private Integer amountMl;
    private Double sleepHours;

    @Column(nullable = false)
    private Instant lastEventAt;

    protected TrackerEntry() {}

    public TrackerEntry(EntryType entryType, Long sourceId, Long userId) {
        this.entryType = entryType;
        this.sourceId = sourceId;
        this.userId = userId;
    }

    public Long getId() { return id; }
    public EntryType getEntryType() { return entryType; }
    public Long getSourceId() { return sourceId; }
    public Long getUserId() { return userId; }
    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }
    public Double getCalories() { return calories; }
    public void setCalories(Double calories) { this.calories = calories; }
    public Integer getDurationMin() { return durationMin; }
    public void setDurationMin(Integer durationMin) { this.durationMin = durationMin; }
    public Integer getAmountMl() { return amountMl; }
    public void setAmountMl(Integer amountMl) { this.amountMl = amountMl; }
    public Double getSleepHours() { return sleepHours; }
    public void setSleepHours(Double sleepHours) { this.sleepHours = sleepHours; }
    public Instant getLastEventAt() { return lastEventAt; }
    public void setLastEventAt(Instant lastEventAt) { this.lastEventAt = lastEventAt; }
}
