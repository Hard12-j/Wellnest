package com.wellnest.content.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "blog", indexes = {
        @Index(name = "idx_blog_author", columnList = "authorId"),
        @Index(name = "idx_blog_published", columnList = "publishedDate")
})
public class Blog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    /** userId from the X-User-Id header. No join to the auth database. */
    @Column(nullable = false)
    private Long authorId;

    private String authorName;

    /** TRAINER, taken from X-User-Role at creation time. */
    @Column(nullable = false, length = 20)
    private String authorType;

    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BlogStatus status = BlogStatus.PUBLISHED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentType contentType = ContentType.ARTICLE;

    @Column(nullable = false, updatable = false)
    private Instant publishedDate;

    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        publishedDate = Instant.now();
        updatedAt = publishedDate;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public String getAuthorType() { return authorType; }
    public void setAuthorType(String authorType) { this.authorType = authorType; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public BlogStatus getStatus() { return status; }
    public void setStatus(BlogStatus status) { this.status = status; }
    public ContentType getContentType() { return contentType; }
    public void setContentType(ContentType contentType) { this.contentType = contentType; }
    public Instant getPublishedDate() { return publishedDate; }
    public Instant getUpdatedAt() { return updatedAt; }
}
