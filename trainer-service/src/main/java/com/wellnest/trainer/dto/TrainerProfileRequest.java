package com.wellnest.trainer.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record TrainerProfileRequest(
        @NotBlank String first,
        @NotBlank String last,
        @NotBlank String specialization,
        String location,
        @Min(0) @Max(60) Integer experienceYears,
        @Size(max = 20) String contactNo,
        String availability,
        @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal monthlyFee) { }
