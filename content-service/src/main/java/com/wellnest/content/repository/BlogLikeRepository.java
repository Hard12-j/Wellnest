package com.wellnest.content.repository;

import com.wellnest.content.model.BlogLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BlogLikeRepository extends JpaRepository<BlogLike, Long> {

    Optional<BlogLike> findByBlogIdAndUserId(Long blogId, Long userId);

    boolean existsByBlogIdAndUserId(Long blogId, Long userId);

    long countByBlogId(Long blogId);

    void deleteByBlogId(Long blogId);

    /** rows of [blogId, count] */
    @Query("select l.blogId, count(l) from BlogLike l where l.blogId in :ids group by l.blogId")
    List<Object[]> countByBlogIds(@Param("ids") Collection<Long> ids);

    @Query("select l.blogId from BlogLike l where l.userId = :userId and l.blogId in :ids")
    List<Long> findLikedBlogIds(@Param("userId") Long userId, @Param("ids") Collection<Long> ids);
}
