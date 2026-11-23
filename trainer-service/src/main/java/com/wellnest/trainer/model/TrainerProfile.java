package com.wellnest.trainer.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "trainer_profiles")
public class TrainerProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;                 // auth-service user id (role TRAINER)

    @Column(nullable = false) private String first;
    @Column(nullable = false) private String last;
    @Column(nullable = false) private String specialization;
    private String location;
    private Integer experienceYears;
    private String contactNo;
    private String availability;
    @Column(name = "session_fee", precision = 10, scale = 2)
    private BigDecimal monthlyFee;

    @Column(nullable = false)
    private boolean verified = false;    // set by admin later

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getFirst() { return first; }
    public void setFirst(String first) { this.first = first; }
    public String getLast() { return last; }
    public void setLast(String last) { this.last = last; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String s) { this.specialization = s; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer e) { this.experienceYears = e; }
    public String getContactNo() { return contactNo; }
    public void setContactNo(String contactNo) { this.contactNo = contactNo; }
    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }
    public BigDecimal getMonthlyFee() { return monthlyFee; }
    public void setMonthlyFee(BigDecimal monthlyFee) { this.monthlyFee = monthlyFee; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
}
