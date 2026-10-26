package com.wellnest.content.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "blog_comment", indexes = @Index(name = "idx_comment_blog", columnList = "blogId"))
public class BlogComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long blogId;

    @Column(nullable = false)
    private Long userId;

    private String userName;

    @Column(nullable = false, length = 1000)
    private String commentText;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public Long getId() { return id; }
    public Long getBlogId() { return blogId; }
    public void setBlogId(Long blogId) { this.blogId = blogId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getCommentText() { return commentText; }
    public void setCommentText(String commentText) { this.commentText = commentText; }
    public Instant getCreatedAt() { return createdAt; }
}
