package com.wellnest.tracker.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "hydration_logs", indexes = @Index(columnList = "user_id, log_date"))
public class HydrationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(nullable = false)
    private Integer amountMl;

    protected HydrationLog() {}
    public HydrationLog(Long userId) { this.userId = userId; }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }
    public Integer getAmountMl() { return amountMl; }
    public void setAmountMl(Integer amountMl) { this.amountMl = amountMl; }
}
