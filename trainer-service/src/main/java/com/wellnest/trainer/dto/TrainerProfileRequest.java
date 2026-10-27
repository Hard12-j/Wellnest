package com.wellnest.trainer.dto;

import jakarta.validation.constraints.*;

public record TrainerProfileRequest(
        @NotBlank String first,
        @NotBlank String last,
        @NotBlank String specialization,
        String location,
        @Min(0) @Max(60) Integer experienceYears,
        @Size(max = 20) String contactNo,
        String availability) { }
