package com.wellnest.content.dto;

import java.time.Instant;

public record CommentResponse(Long id, Long blogId, Long userId, String userName,
                              String commentText, Instant createdAt) {
}
