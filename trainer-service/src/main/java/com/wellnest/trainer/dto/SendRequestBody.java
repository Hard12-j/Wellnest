package com.wellnest.trainer.dto;

import jakarta.validation.constraints.NotNull;

public record SendRequestBody(@NotNull Long trainerId) { }
