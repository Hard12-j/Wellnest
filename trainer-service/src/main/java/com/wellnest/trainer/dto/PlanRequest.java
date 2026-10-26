package com.wellnest.trainer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlanRequest(@NotNull Long userId, @NotBlank String title, @NotBlank String details) { }
