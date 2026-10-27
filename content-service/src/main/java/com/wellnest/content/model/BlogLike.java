package com.wellnest.content.model;

import jakarta.persistence.*;

@Entity
@Table(name = "blog_like", uniqueConstraints =
        @UniqueConstraint(name = "uk_like_blog_user", columnNames = {"blogId", "userId"}))
public class BlogLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long blogId;

    @Column(nullable = false)
    private Long userId;

    public Long getId() { return id; }
    public Long getBlogId() { return blogId; }
    public void setBlogId(Long blogId) { this.blogId = blogId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
