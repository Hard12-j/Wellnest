package com.example.Auth_service.dto;

public record AuthResponse(String accessToken, String tokenType, long expiresIn, UserResponse user) {}

