package com.wellnest.profile.dto;

public record BmiResponse(double bmi, String category, String guidance, Double kgToTarget) {}
