package com.wellnest.content.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        @NotBlank @Size(max = 1000) String commentText,
        @Size(max = 255) String userName) {
}
