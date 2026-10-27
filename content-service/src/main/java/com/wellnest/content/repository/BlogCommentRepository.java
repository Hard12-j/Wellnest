package com.wellnest.content.repository;

import com.wellnest.content.model.BlogComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface BlogCommentRepository extends JpaRepository<BlogComment, Long> {

    Page<BlogComment> findByBlogId(Long blogId, Pageable pageable);

    long countByBlogId(Long blogId);

    void deleteByBlogId(Long blogId);

    /** rows of [blogId, count] */
    @Query("select c.blogId, count(c) from BlogComment c where c.blogId in :ids group by c.blogId")
    List<Object[]> countByBlogIds(@Param("ids") Collection<Long> ids);
}
