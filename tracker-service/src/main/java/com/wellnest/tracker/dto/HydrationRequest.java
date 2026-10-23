package com.wellnest.tracker.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record HydrationRequest(
        @NotNull @PastOrPresent LocalDate date,
        @NotNull @Min(1) @Max(5000) Integer amountMl) {}
