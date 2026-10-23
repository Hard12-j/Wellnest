package com.wellnest.tracker.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "sleep_logs", indexes = @Index(columnList = "user_id, log_date"))
public class SleepLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(nullable = false)
    private Double hours;

    private Integer quality;

    protected SleepLog() {}
    public SleepLog(Long userId) { this.userId = userId; }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }
    public Double getHours() { return hours; }
    public void setHours(Double hours) { this.hours = hours; }
    public Integer getQuality() { return quality; }
    public void setQuality(Integer quality) { this.quality = quality; }
}
