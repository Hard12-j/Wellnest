package com.wellnest.content.dto;

import com.wellnest.content.model.BlogStatus;
import com.wellnest.content.model.ContentType;

import java.time.Instant;

public record BlogResponse(
        Long id,
        String title,
        String category,
        String content,
        Long authorId,
        String authorName,
        String authorType,
        String imageUrl,
        BlogStatus status,
        ContentType contentType,
        Instant publishedDate,
        Instant updatedAt,
        long likesCount,
        long commentsCount,
        boolean likedByMe) {
}
