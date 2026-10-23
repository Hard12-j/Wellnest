package com.wellnest.tracker.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record SleepRequest(
        @NotNull @PastOrPresent LocalDate date,
        @NotNull @DecimalMin("0.5") @DecimalMax("24") Double hours,
        @Min(1) @Max(5) Integer quality) {}
