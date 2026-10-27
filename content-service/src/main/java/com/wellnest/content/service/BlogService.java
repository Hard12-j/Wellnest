package com.wellnest.content.service;

import com.wellnest.content.dto.*;
import com.wellnest.content.exception.ForbiddenException;
import com.wellnest.content.exception.NotFoundException;
import com.wellnest.content.model.*;
import com.wellnest.content.repository.BlogCommentRepository;
import com.wellnest.content.repository.BlogLikeRepository;
import com.wellnest.content.repository.BlogRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@Transactional
public class BlogService {

    private static final int MAX_PAGE_SIZE = 50;

    private final BlogRepository blogs;
    private final BlogCommentRepository comments;
    private final BlogLikeRepository likes;
    private final ImageStorageService images;

    public BlogService(BlogRepository blogs, BlogCommentRepository comments,
                       BlogLikeRepository likes, ImageStorageService images) {
        this.blogs = blogs;
        this.comments = comments;
        this.likes = likes;
        this.images = images;
    }

    // ---------- blogs ----------

    @Transactional(readOnly = true)
    public PageResponse<BlogResponse> listPublished(String category, ContentType contentType,
                                                    String q, int page, int size, Long viewerId) {
        Specification<Blog> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.equal(root.get("status"), BlogStatus.PUBLISHED));
            if (hasText(category)) {
                p.add(cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase()));
            }
            if (contentType != null) {
                p.add(cb.equal(root.get("contentType"), contentType));
            }
            if (hasText(q)) {
                p.add(cb.like(cb.lower(root.get("title")), "%" + q.trim().toLowerCase() + "%"));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        Page<Blog> result = blogs.findAll(spec, pageable(page, size));
        return PageResponse.of(result, toResponses(result.getContent(), viewerId));
    }

    /** The caller's own blogs, including drafts. */
    @Transactional(readOnly = true)
    public PageResponse<BlogResponse> listMine(Long userId, int page, int size) {
        Specification<Blog> spec = (root, query, cb) -> cb.equal(root.get("authorId"), userId);
        Page<Blog> result = blogs.findAll(spec, pageable(page, size));
        return PageResponse.of(result, toResponses(result.getContent(), userId));
    }

    @Transactional(readOnly = true)
    public BlogResponse getById(Long id, Long viewerId) {
        Blog blog = findVisible(id, viewerId);
        return toResponses(List.of(blog), viewerId).get(0);
    }

    public BlogResponse create(Long userId, String role, BlogRequest req, MultipartFile image) {
        ContentType type = req.contentType();
        if (type == null) {
            type = Roles.canWriteArticles(role) ? ContentType.ARTICLE : ContentType.POST;
        }

        if (type == ContentType.ARTICLE) {
            if (!Roles.canWriteArticles(role)) {
                throw new ForbiddenException("Only trainers can create articles");
            }
        } else {
            if (!Roles.canWritePosts(role)) {
                throw new ForbiddenException("Only users and trainers can create posts");
            }
        }

        Blog blog = new Blog();
        blog.setAuthorId(userId);
        blog.setAuthorType(Roles.normalize(role));
        blog.setAuthorName(req.authorName());
        blog.setContentType(type);
        // For short posts, no image is attached
        applyFields(blog, req, type == ContentType.ARTICLE ? image : null);
        return toResponses(List.of(blogs.save(blog)), userId).get(0);
    }

    public BlogResponse update(Long id, Long userId, BlogRequest req, MultipartFile image) {
        Blog blog = blogs.findById(id).orElseThrow(() -> notFound(id));
        requireOwner(blog.getAuthorId(), userId, "edit this blog");
        applyFields(blog, req, image);
        return toResponses(List.of(blogs.save(blog)), userId).get(0);
    }

    public void delete(Long id, Long userId) {
        Blog blog = blogs.findById(id).orElseThrow(() -> notFound(id));
        requireOwner(blog.getAuthorId(), userId, "delete this blog");
        likes.deleteByBlogId(id);
        comments.deleteByBlogId(id);
        blogs.delete(blog);
    }

    // ---------- comments ----------

    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> listComments(Long blogId, Long viewerId, int page, int size) {
        findVisible(blogId, viewerId);
        Pageable pageable = PageRequest.of(Math.max(page, 0), clampSize(size), Sort.by("createdAt").ascending());
        Page<BlogComment> result = comments.findByBlogId(blogId, pageable);
        return PageResponse.of(result, result.getContent().stream().map(this::toComment).toList());
    }

    public CommentResponse addComment(Long blogId, Long userId, CommentRequest req) {
        findVisible(blogId, userId);
        BlogComment c = new BlogComment();
        c.setBlogId(blogId);
        c.setUserId(userId);
        c.setUserName(req.userName());
        c.setCommentText(req.commentText().trim());
        return toComment(comments.save(c));
    }

    /** A comment can be deleted by its writer or by the trainer who owns the blog. */
    public void deleteComment(Long commentId, Long userId) {
        BlogComment c = comments.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found with id: " + commentId));
        Long blogAuthorId = blogs.findById(c.getBlogId()).map(Blog::getAuthorId).orElse(null);
        if (!Objects.equals(c.getUserId(), userId) && !Objects.equals(blogAuthorId, userId)) {
            throw new ForbiddenException("You are not allowed to delete this comment");
        }
        comments.delete(c);
    }

    // ---------- likes ----------

    public LikeResponse toggleLike(Long blogId, Long userId) {
        findVisible(blogId, userId);
        Optional<BlogLike> existing = likes.findByBlogIdAndUserId(blogId, userId);
        boolean liked;
        if (existing.isPresent()) {
            likes.delete(existing.get());
            liked = false;
        } else {
            BlogLike like = new BlogLike();
            like.setBlogId(blogId);
            like.setUserId(userId);
            likes.save(like); // unique(blog_id, user_id) guards double-clicks; handler returns 409
            liked = true;
        }
        likes.flush();
        return new LikeResponse(liked, likes.countByBlogId(blogId));
    }

    // ---------- helpers ----------

    private void applyFields(Blog blog, BlogRequest req, MultipartFile image) {
        blog.setTitle(req.title().trim());
        blog.setCategory(req.category().trim());
        blog.setContent(req.content());
        if (req.status() != null) blog.setStatus(req.status());
        if (req.contentType() != null) blog.setContentType(req.contentType());

        String uploaded = images.saveBlogImage(image);
        if (uploaded != null) {
            blog.setImageUrl(uploaded);
        } else if (req.imageUrl() != null) {
            blog.setImageUrl(req.imageUrl().isBlank() ? null : req.imageUrl().trim());
        }
    }

    /** Drafts are visible only to their author. */
    private Blog findVisible(Long id, Long viewerId) {
        Blog blog = blogs.findById(id).orElseThrow(() -> notFound(id));
        if (blog.getStatus() == BlogStatus.DRAFT) {
            boolean allowed = viewerId != null && viewerId.equals(blog.getAuthorId());
            if (!allowed) throw notFound(id);
        }
        return blog;
    }

    private void requireOwner(Long ownerId, Long userId, String action) {
        if (!Objects.equals(ownerId, userId)) {
            throw new ForbiddenException("You are not allowed to " + action);
        }
    }

    private NotFoundException notFound(Long id) {
        return new NotFoundException("Blog not found with id: " + id);
    }

    private Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), clampSize(size), Sort.by(Sort.Direction.DESC, "publishedDate"));
    }

    private int clampSize(int size) {
        return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    }

    private boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    /** Builds responses with batched like/comment counts instead of one query per blog. */
    private List<BlogResponse> toResponses(List<Blog> list, Long viewerId) {
        if (list.isEmpty()) return List.of();
        List<Long> ids = list.stream().map(Blog::getId).toList();
        Map<Long, Long> likeCounts = toMap(likes.countByBlogIds(ids));
        Map<Long, Long> commentCounts = toMap(comments.countByBlogIds(ids));
        Set<Long> likedByViewer = viewerId == null
                ? Set.of() : new HashSet<>(likes.findLikedBlogIds(viewerId, ids));

        return list.stream().map(b -> new BlogResponse(
                b.getId(), b.getTitle(), b.getCategory(), b.getContent(),
                b.getAuthorId(), b.getAuthorName(), b.getAuthorType(), b.getImageUrl(),
                b.getStatus(), b.getContentType(), b.getPublishedDate(), b.getUpdatedAt(),
                likeCounts.getOrDefault(b.getId(), 0L),
                commentCounts.getOrDefault(b.getId(), 0L),
                likedByViewer.contains(b.getId()))).toList();
    }

    private Map<Long, Long> toMap(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] r : rows) map.put((Long) r[0], (Long) r[1]);
        return map;
    }

    private CommentResponse toComment(BlogComment c) {
        return new CommentResponse(c.getId(), c.getBlogId(), c.getUserId(),
                c.getUserName(), c.getCommentText(), c.getCreatedAt());
    }
}
