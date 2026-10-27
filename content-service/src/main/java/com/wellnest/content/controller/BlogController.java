package com.wellnest.content.controller;

import com.wellnest.content.dto.*;
import com.wellnest.content.model.ContentType;
import com.wellnest.content.service.BlogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Identity comes from headers set by the gateway (X-User-Id; X-User-Role is needed only to create blogs).
 * This service must never be exposed publicly.
 */
@RestController
@RequestMapping("/api/content")
public class BlogController {

    private final BlogService service;

    public BlogController(BlogService service) {
        this.service = service;
    }

    // ----- blogs -----

    @GetMapping("/blogs")
    public PageResponse<BlogResponse> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) ContentType contentType,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return service.listPublished(category, contentType, q, page, size, userId);
    }

    @GetMapping("/blogs/mine")
    public PageResponse<BlogResponse> mine(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.listMine(userId, page, size);
    }

    @GetMapping("/blogs/{id}")
    public BlogResponse get(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return service.getById(id, userId);
    }

    @PostMapping(value = "/blogs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BlogResponse> createMultipart(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String role,
            @RequestPart("blog") @Valid BlogRequest blog,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(userId, role, blog, image));
    }

    @PostMapping(value = "/blogs", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<BlogResponse> createJson(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String role,
            @RequestBody @Valid BlogRequest blog) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(userId, role, blog, null));
    }

    @PutMapping(value = "/blogs/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BlogResponse updateMultipart(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId,
            @RequestPart("blog") @Valid BlogRequest blog,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return service.update(id, userId, blog, image);
    }

    @PutMapping(value = "/blogs/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public BlogResponse updateJson(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody @Valid BlogRequest blog) {
        return service.update(id, userId, blog, null);
    }

    @DeleteMapping("/blogs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        service.delete(id, userId);
    }

    // ----- likes -----

    @PostMapping("/blogs/{id}/like")
    public LikeResponse toggleLike(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return service.toggleLike(id, userId);
    }

    // ----- comments -----

    @GetMapping("/blogs/{id}/comments")
    public PageResponse<CommentResponse> comments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return service.listComments(id, userId, page, size);
    }

    @PostMapping("/blogs/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody @Valid CommentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addComment(id, userId, req));
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable Long commentId,
            @RequestHeader("X-User-Id") Long userId) {
        service.deleteComment(commentId, userId);
    }
}
