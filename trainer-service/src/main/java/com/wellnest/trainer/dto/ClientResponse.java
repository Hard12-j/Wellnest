package com.wellnest.trainer.dto;

import java.time.Instant;

public record ClientResponse(Long userId, String fitnessGoal, Instant since) { }
