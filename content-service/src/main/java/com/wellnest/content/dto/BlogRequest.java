package com.wellnest.content.dto;

import com.wellnest.content.model.BlogStatus;
import com.wellnest.content.model.ContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BlogRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 60) String category,
        @NotBlank String content,
        @Size(max = 255) String authorName,
        @Size(max = 500) String imageUrl,
        BlogStatus status,
        ContentType contentType) {
}
