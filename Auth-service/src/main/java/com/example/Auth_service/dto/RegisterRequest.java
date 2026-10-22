package com.example.Auth_service.dto;

import com.example.Auth_service.entities.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String first,
        @NotBlank String last,
        @NotBlank @Email String username,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank String confirmPassword,
        Role role) {}
