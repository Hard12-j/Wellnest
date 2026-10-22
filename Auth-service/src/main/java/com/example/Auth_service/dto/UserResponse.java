package com.example.Auth_service.dto;

import com.example.Auth_service.entities.Role;

public record UserResponse(Long id, String first, String last, String username,
                           Role role, boolean verifiedUser) {}
