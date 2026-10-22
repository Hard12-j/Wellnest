package com.example.Auth_service.dto;

import com.example.Auth_service.entities.User;

public record RotationResult(User user, String refreshToken) {}
